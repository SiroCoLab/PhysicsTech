from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import router
from .config import get_settings


def create_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(title='PhysicsTech API', version='1.0.0', docs_url='/api/docs', openapi_url='/api/openapi.json', redoc_url=None)
    if s.cors_list:
        app.add_middleware(CORSMiddleware, allow_origins=s.cors_list, allow_methods=['GET', 'POST'],
                           allow_headers=['Authorization', 'Content-Type'], max_age=600)

    @app.exception_handler(RequestValidationError)
    async def _bad_request(_: Request, exc: RequestValidationError):
        return JSONResponse({'detail': 'Неверный формат запроса'}, status_code=422)

    @app.middleware('http')
    async def _headers(request: Request, call_next):
        resp = await call_next(request)
        p = request.url.path
        if p == '/' or p.endswith('.html'):
            # Telegram WebView caches pages aggressively; always revalidate the app page
            resp.headers['Cache-Control'] = 'no-cache'
        if p.startswith('/api/'):
            resp.headers['Cache-Control'] = 'no-store'
        resp.headers.setdefault('X-Content-Type-Options', 'nosniff')
        resp.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        return resp

    app.include_router(router)
    front = Path(s.frontend_dir)
    if (front / 'index.html').is_file():
        app.mount('/', StaticFiles(directory=front, html=True), name='frontend')
    return app


app = create_app()

