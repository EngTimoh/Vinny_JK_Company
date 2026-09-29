import os
import io
import logging
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)

# Default maximum dimensions and quality
MAX_IMAGE_DIMENSIONS = (1600, 1200)
WEBP_QUALITY = 82

def optimize_image(image_file, max_size=MAX_IMAGE_DIMENSIONS, quality=WEBP_QUALITY):
    """
    Takes an image file (UploadedFile, FieldFile, or file-like object),
    performs the following pipeline:
      1. Opens with Pillow
      2. Corrects EXIF orientation (prevents rotated mobile uploads)
      3. Resizes down if larger than max_size (preserving aspect ratio)
      4. Converts color mode (RGBA for transparency, RGB otherwise)
      5. Compresses and converts to WebP format
      6. Returns a Django ContentFile with .webp extension
    """
    if not image_file:
        return None

    try:
        # Seek to start if file-like
        if hasattr(image_file, 'seek'):
            image_file.seek(0)

        # 1. Open with Pillow
        with Image.open(image_file) as img:
            # 2. Correct EXIF orientation
            img = ImageOps.exif_transpose(img)

            # 3. Resize if larger than max_size (LANCZOS downsampling, never upscale)
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # 4. Color mode conversion for WebP
            # WebP supports RGBA (transparency) and RGB.
            has_alpha = (
                img.mode in ('RGBA', 'LA') or
                (img.mode == 'P' and 'transparency' in img.info)
            )
            if has_alpha:
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')

            # 5. Compress & Convert to WebP
            output_io = io.BytesIO()
            img.save(
                output_io,
                format='WEBP',
                quality=quality,
                method=6,
                optimize=True
            )
            output_io.seek(0)

            # 6. Build new .webp filename
            original_name = getattr(image_file, 'name', 'image.jpg')
            base_name = os.path.splitext(os.path.basename(original_name))[0]
            # Clean name of any weird characters
            clean_base = "".join(c for c in base_name if c.isalnum() or c in ('-', '_')).strip() or 'image'
            webp_filename = f"{clean_base}.webp"

            return ContentFile(output_io.getvalue(), name=webp_filename)

    except Exception as e:
        logger.error(f"Error optimizing image {getattr(image_file, 'name', '')}: {e}")
        # If optimization fails, seek back and return original file
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        return image_file


def process_model_image_field(instance, field_name='image', max_size=MAX_IMAGE_DIMENSIONS, quality=WEBP_QUALITY):
    """
    Helper to be called in a model's save() or pre_save signal.
    Detects if the image is newly uploaded or modified, optimizes it to WebP,
    and updates the field before saving.
    """
    image_field = getattr(instance, field_name, None)
    if not image_field:
        return

    # Check if instance already exists in DB
    if instance.pk:
        try:
            # Fetch current DB record to check if image was modified
            current_db_instance = instance.__class__.objects.filter(pk=instance.pk).only(field_name).first()
            if current_db_instance:
                current_db_image = getattr(current_db_instance, field_name, None)
                # If image field hasn't changed, skip optimization
                if current_db_image and current_db_image.name == image_field.name:
                    return
                # If image is being replaced, clean up old file if it exists
                if current_db_image and current_db_image.name:
                    try:
                        storage = current_db_image.storage
                        if storage.exists(current_db_image.name):
                            storage.delete(current_db_image.name)
                    except Exception as clean_err:
                        logger.warning(f"Could not delete old image file: {clean_err}")
        except Exception as e:
            logger.warning(f"Error checking previous image in DB: {e}")

    # Check if it's an uploaded file or needs conversion
    is_uploaded = isinstance(getattr(image_field, 'file', None), UploadedFile)
    is_not_webp = not image_field.name.lower().endswith('.webp')

    if is_uploaded or is_not_webp:
        try:
            optimized_file = optimize_image(image_field, max_size=max_size, quality=quality)
            if optimized_file and optimized_file != image_field:
                # Save optimized file to field without triggering model save recursion
                image_field.save(optimized_file.name, optimized_file, save=False)
        except Exception as e:
            logger.error(f"Failed to process image field '{field_name}' on {instance}: {e}")
