from django.contrib import admin
from .models import Services, Product, Order, Booking, Category, OrderItem, Gallery

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'total_price', 'created_at', 'is_paid', 'is_delivered')
    inlines = [OrderItemInline]

class GalleryAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('title', 'category')

admin.site.register(Gallery, GalleryAdmin)
admin.site.register(Services)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Order, OrderAdmin)
admin.site.register(Booking)
