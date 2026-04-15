FROM php:8.2-apache

# Enable Apache rewrite (important for PHP apps)
RUN a2enmod rewrite

# Copy your project into Apache folder
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html
