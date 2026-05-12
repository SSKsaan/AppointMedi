from decouple import config

if config('DJANGO_ENV', default='development') == 'production':
    from .prod import *
else:
    from .dev import *
