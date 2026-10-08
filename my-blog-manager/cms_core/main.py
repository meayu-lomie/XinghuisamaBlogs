import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 引入所有 API 路由
from cms_core.api import config, picbed, drafts, moments, model_config
from cms_core.api import gallery, projects
from cms_core.api import deploy

app = FastAPI(title="拾光集 控制台后端", version="1.0.0")

# 本机来源白名单：launcher 每次启动都用随机端口拉起前端，
# 所以按「任意端口 + 仅本机主机名」放行，而不是放开所有来源。
LOCAL_ORIGIN_RE = re.compile(r"^https?://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$")

app.add_middleware(
    CORSMiddleware,
    # 只允许本机页面跨域调用。原先 allow_origins=["*"] 配合
    # allow_credentials=True，等于任何网页都能读写本机控制台与配置。
    allow_origin_regex=LOCAL_ORIGIN_RE.pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def block_foreign_origin(request: Request, call_next):
    """拦截非本机来源的请求。

    CORS 只约束浏览器「读」响应，挡不住恶意页面发出的写请求。
    浏览器对跨域请求一定会带 Origin 头，这里直接拒掉非本机来源，
    从入口掐断「打开某个网页 → 它偷偷改本机博客配置/推代码」的路径。
    不带 Origin 的请求（curl、脚本、服务端调用）放行。
    """
    origin = request.headers.get("origin")
    if origin and not LOCAL_ORIGIN_RE.match(origin):
        return JSONResponse(
            status_code=403,
            content={"success": False, "message": "拒绝非本机来源的请求"},
        )
    return await call_next(request)


@app.get("/api/status")
def get_status():
    return {"status": "online", "message": "后端已连接"}


# 注册所有路由
app.include_router(model_config.router, prefix="/api/model", tags=["ModelConfig"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(picbed.router, prefix="/api/picbed", tags=["PicBed"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["Drafts"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["Gallery"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(moments.router, prefix="/api/moments", tags=["Moments"])
app.include_router(deploy.router, prefix="/api/deploy", tags=["Deploy"])
