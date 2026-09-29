import os
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from api.models import Services, ServiceImage, Product, ProductImage, Gallery
from api.image_utils import optimize_image, MAX_IMAGE_DIMENSIONS, WEBP_QUALITY


class Command(BaseCommand):
    help = "Migrate and compress all existing model images to optimized WebP format."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recompress images even if they already have a .webp extension'
        )
        parser.add_argument(
            '--quality',
            type=int,
            default=WEBP_QUALITY,
            help=f'WebP compression quality (1-100, default: {WEBP_QUALITY})'
        )
        parser.add_argument(
            '--max-width',
            type=int,
            default=MAX_IMAGE_DIMENSIONS[0],
            help=f'Max image width (default: {MAX_IMAGE_DIMENSIONS[0]})'
        )
        parser.add_argument(
            '--max-height',
            type=int,
            default=MAX_IMAGE_DIMENSIONS[1],
            help=f'Max image height (default: {MAX_IMAGE_DIMENSIONS[1]})'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate compression without writing files or updating database'
        )

    def handle(self, *args, **options):
        force = options['force']
        quality = options['quality']
        max_size = (options['max_width'], options['max_height'])
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING("=== RUNNING IN DRY-RUN MODE (No changes will be saved) ==="))

        models_to_check = [
            (Services, 'image'),
            (ServiceImage, 'image'),
            (Product, 'image'),
            (ProductImage, 'image'),
            (Gallery, 'image'),
        ]

        total_processed = 0
        total_skipped = 0
        total_errors = 0
        total_bytes_before = 0
        total_bytes_after = 0

        for model_cls, field_name in models_to_check:
            model_name = model_cls.__name__
            items = model_cls.objects.exclude(**{f"{field_name}__isnull": True}).exclude(**{field_name: ""})
            count = items.count()

            if count == 0:
                self.stdout.write(f"[{model_name}] No records with images found.")
                continue

            self.stdout.write(self.style.SUCCESS(f"\nProcessing {model_name} ({count} items)..."))

            for obj in items:
                image_field = getattr(obj, field_name, None)
                if not image_field or not image_field.name:
                    continue

                storage = image_field.storage
                old_path = image_field.name

                if not storage.exists(old_path):
                    self.stdout.write(self.style.WARNING(f"  [MISSING] {model_name} #{obj.pk}: File {old_path} not found in storage."))
                    total_errors += 1
                    continue

                is_already_webp = old_path.lower().endswith('.webp')
                if is_already_webp and not force:
                    total_skipped += 1
                    continue

                try:
                    # Open original file
                    with storage.open(old_path, 'rb') as f:
                        old_size = f.size
                        optimized_content = optimize_image(f, max_size=max_size, quality=quality)

                    if not optimized_content:
                        self.stdout.write(self.style.ERROR(f"  [FAILED] {model_name} #{obj.pk}: Optimization returned empty."))
                        total_errors += 1
                        continue

                    new_size = len(optimized_content)
                    savings_pct = ((old_size - new_size) / old_size * 100) if old_size > 0 else 0

                    # Generate new storage path with .webp extension
                    dir_name = os.path.dirname(old_path)
                    new_rel_path = os.path.join(dir_name, optimized_content.name).replace('\\', '/')

                    self.stdout.write(
                        f"  [OPTIMIZE] {model_name} #{obj.pk}: {old_path} ({old_size:,} bytes) -> "
                        f"{new_rel_path} ({new_size:,} bytes) [-{savings_pct:.1f}%]"
                    )

                    if not dry_run:
                        # Save new file to storage
                        if storage.exists(new_rel_path) and new_rel_path != old_path:
                            storage.delete(new_rel_path)
                        storage.save(new_rel_path, optimized_content)

                        # Delete old file if path changed
                        if old_path != new_rel_path and storage.exists(old_path):
                            storage.delete(old_path)

                        # Update DB without re-triggering image optimization save logic
                        model_cls.objects.filter(pk=obj.pk).update(**{field_name: new_rel_path})

                    total_processed += 1
                    total_bytes_before += old_size
                    total_bytes_after += new_size

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [ERROR] {model_name} #{obj.pk}: {e}"))
                    total_errors += 1

        # Summary
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("COMPRESSION SUMMARY"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Total Processed: {total_processed}")
        self.stdout.write(f"Total Skipped (already WebP): {total_skipped}")
        self.stdout.write(f"Total Errors/Missing: {total_errors}")

        if total_bytes_before > 0:
            total_savings = total_bytes_before - total_bytes_after
            total_savings_pct = (total_savings / total_bytes_before) * 100
            self.stdout.write(f"Original Size: {total_bytes_before / (1024 * 1024):.2f} MB ({total_bytes_before:,} bytes)")
            self.stdout.write(f"Optimized Size: {total_bytes_after / (1024 * 1024):.2f} MB ({total_bytes_after:,} bytes)")
            self.stdout.write(self.style.SUCCESS(f"Saved: {total_savings / (1024 * 1024):.2f} MB ({total_savings_pct:.1f}% reduction)"))
        else:
            self.stdout.write("No images needed compression.")
