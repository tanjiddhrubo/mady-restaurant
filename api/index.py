import os, sys
from os.path import dirname, abspath

# ABSOLUTE FIRST STEP: Fix the path so 'from app...' always works on Vercel
root_path = dirname(abspath(__file__))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import uuid

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel import Session

from app.application.menu_service import MenuService
from app.core.config import settings
from app.domain.models import Category, ClickEvent, MenuItem, SubCategory
from app.infrastructure.database import create_db_and_tables, engine, get_session
from app.infrastructure.menu_repository import SqlMenuRepository

# Directories
BACKEND_DIR = Path(__file__).parent
UPLOAD_DIR = BACKEND_DIR / "static" / "uploads"
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"

# Avoid creating directories on Vercel's read-only filesystem
if not os.environ.get("VERCEL"):
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Pydantic request / response schemas
# ---------------------------------------------------------------------------

class CategoryRead(BaseModel):
    id: int
    name: str
    icon: str
    display_order: int

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    icon: str = "restaurant_menu"
    display_order: int = 0


class SubCategoryRead(BaseModel):
    id: int
    name: str
    icon: str
    display_order: int
    category_id: Optional[int]

    model_config = {"from_attributes": True}


class SubCategoryCreate(BaseModel):
    name: str
    icon: str = "label"
    display_order: int = 0
    category_id: Optional[int] = None


class MenuItemRead(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    rating: float
    is_available: bool
    is_featured: bool
    category_id: Optional[int]
    category_name: Optional[str] = None
    foodpanda_url: str = ""

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    rating: float = 5.0
    is_available: bool = True
    is_featured: bool = False
    category_id: Optional[int] = None
    foodpanda_url: str = ""




# ---------------------------------------------------------------------------
# Dependency helpers
# ---------------------------------------------------------------------------

def get_menu_service(session: Session = Depends(get_session)) -> MenuService:
    return MenuService(SqlMenuRepository(session))


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

SEED_CATEGORIES = [
    {"name": "Burgers", "icon": "lunch_dining", "display_order": 1},
    {"name": "Sides",   "icon": "fastfood",     "display_order": 2},
    {"name": "Drinks",  "icon": "local_drink",  "display_order": 3},
    {"name": "Desserts","icon": "icecream",     "display_order": 4},
]

SEED_ITEMS = [
    # Burgers (cat 1)
    {"name": "Classic Mady", "description": "Premium beef patty, secret house sauce, pickles, and fresh lettuce on a toasted brioche bun.", "price": 12.99, "rating": 4.9, "category_id": 1,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuD2ngy6phOx4-OelnoFmyIIya5e0ac10aQNtAP5mjQ90IDQgCrowKG4PmkFXb4HyCGDJuiCKO6IG8MNuDGGtEWQL8RpOurZGayNjt-R2oqahc0i10Bd_HKyZvyfMnirHjNQMC2_NYUVxzL5I_5NmEWGXWwwM9ojF-o5wdp3jf0F45VP-CFtvfe0egGyx0XoLLDd8rCh_ZbrjXmaJz3ZW2sHDKgkij_A9qbJbYs1U-Vnnv_n1lxipF65Dmyqmd5DDOHgPpu_Leg5eJQ"},
    {"name": "Double Cheese", "description": "Two flame-grilled beef patties with double melted cheddar and caramelized onions.", "price": 15.99, "rating": 4.8, "category_id": 1,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDB5mDYPqVfScc45Xd2J5BB6XFlWMn1gQ-OC08144Cgk7Fi9RM6n2h5bEOPqgpo-kbCBY-MxOYmfAXTGi5tHwgMkjjftVIr1i1dgOz4uMmIIlWAESO7sKqtjwRULTsDnaPWEebZ__qQT28RPvgbERCdH57i2dFrlD2so4TXIc7wuQaoEST9mI5TnSuweKCDZIXxb-uADWKYYVR5XQEzpCaMZ5-Q-MYwkQGwFrco455eApdslAF8ix2hocUkdFXxqFn2q2iMAl6cuak"},
    {"name": "Spicy Mady",    "description": "Crispy chicken breast with spicy slaw, jalapenos, and sriracha mayo.", "price": 13.50, "rating": 4.7, "category_id": 1,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQwRwYnc0peRwCmR-HHLlPQKODJG-yVIOlzRmMyKXl0m9nftVmOqFdltmlX7N16q0g1Pl-khuYwshvcyyU7bdYwpOWKpFF6IsQc7YvugG2LY_zA9BTZy4wpxYHyL2Y1g9BaewdqNDtS1rKo08rELb33S37aVdIqqcpx7Q6fOeyCq2EyE5vBf0zGnkJMR1zNs2P9b3rg0LqhVGEFFALnEvwMBK1c4ZRIrIY46b49jfzVdH4jSm3z2v9dnBycxZZAHwI9xjsyhFIhg"},
    # Sides (cat 2)
    {"name": "Truffle Fries",  "description": "Golden hand-cut fries tossed in truffle oil and parmesan cheese.", "price": 6.50, "rating": 4.8, "category_id": 2,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBFLfDGvSeuppZzJc2b2GjVsLOtaUHXJCW9HGER_8HbnhYPnD6R3Z_U2SRVSgVvZJhpCm2qTE0Lmhv-AGg9qoOYNRFPkyHiCdomr_3F-86cyINp46BPr7YaU6-Z6qGljiRZW9HJnYHdm9DESwN-BA9VBvuzOFRLP1wdB9XqAGuoqe7aP5A8pXStoYSV44Fpd0FGUE6LNSa-5KmT21qA0UquwafVI8HbdHk4i_8pC1Hi_at-ob9kqPNgNQDNTFEooBIkhy86xqujzus"},
    {"name": "Crunchy Rings",  "description": "Crisp, thick-cut sweet onion rings battered in a special spice mix.", "price": 5.50, "rating": 4.6, "category_id": 2,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBsyVzIoSE2O4VwxSMrQirnGghtHd9hIoMp-bnXVBkli7GA80oGUIZk0XKJkurH4Dn4x7kDWs1w8mEwPvWY_JXVPL1KYbMaGN1IpgodbbU5HTnbLMZM0D28yObcHjFEDFnRYOntuADvCxgIlBooN23CTQdvVcwSRGBSeBot-_2M6D3z3F5FWH1AfJZmft6guCAFen7F0JRQPqmX3YNuSf_Vsg5vzVc0oSX2P-2VJOc1HJPZ4RsnJkx-k4wCIiwzQdczpcZ46srjCsk"},
    # Drinks (cat 3)
    {"name": "Mady Special Soda", "description": "Our signature refreshing craft soda with natural fruit extracts.", "price": 4.00, "rating": 4.5, "category_id": 3,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuAVPsh4gE6pUa7UE0mr20F39gZOnZWjaB6gZsUtaNWOOChNlYBCDEdnRIe3bRk5B7njZSD0BuAfYxaef6jJ9PUeXbVCz5ZGZHqtlFpYgC4RvgxBNBYCAwnfEfTKh9L-J7GP7gbqakg5AU3Q2-GrdLzizq5bMLksST0l4lTpckufx9w9zVJQkmUWLbCvDuHMbiksb6t79aCqVQnqxAaXxaBiYSvKXOlGG7UnELppWbeBw1ArXnvSgeHv7ZAueESZUKS9Kw1BmJcvZvw"},
    {"name": "Citrus Iced Tea",   "description": "Refreshing mixed citrus iced tea with a hint of mint.", "price": 4.50, "rating": 4.7, "category_id": 3,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCx1VJhrB0mIWQTFIgYQs9R9c-ehyLxhgjrRr8claWW695wXAKW-DLTBm99YXNibAvM6ltgAQQ2Jmsu1gSRd4A9Hmpc3vXwCTgoYQ5ypDQfaUarKXUrzwxtYKki8Iv-g_KFrCEoKBaOcTSxQmBeAIRs7fezu9FweLtPKICcfrNCAQQWO-_SjC_fipfzS_VcRBLaaenr63yl34-BBPKp4nUG2NSH2T86Xyw4jvnQb7Lma7lK7EeFAgTHTON3wyPABal8lcv7oewBzFY"},
    # Desserts (cat 4)
    {"name": "Velvet Cheesecake", "description": "New York style cheesecake with fresh strawberries.", "price": 11.00, "rating": 4.9, "category_id": 4,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCbLFYcI7V3GSb5JqZ0BZQEG8Y_vl2Ko1nTG3fVkQIYVfzj5ZNLC8yAwhPO0Wsq-1R5Y_YZLsP5Yd6pRgjAagstq91o2utc8kcUkFc2-fJAlAx4MsQxGEBGQKxrNPRSJ9FFd8JocN0Zg0Hxj1KiDUxTe6vZE_iTHZkptLHgg1csh9WO-oniyOkG-I_wA87KUP7DHhykVyP8UbSxbBO5Tcsc8mzLFD7CKtKRvazNs-fLAH4iWPRUsyMlICHSNiT417m8g-r_JJiCkrA"},
    {"name": "Double Choc Donut", "description": "Rich dark chocolate glaze with cocoa sprinkles.", "price": 6.50, "rating": 4.6, "category_id": 4,
     "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBYuvyn36uXjOMYWYj5D2RW3RjvHwsQwRdd6K-B0FnBX-llUi36RbtI0fpwpinRKnPEgjFlTuyuXzTS7pMXJSSj4SvahE8D24DxSDSP-9v-dEhYUa6wYzQXSxU79XBqmeVT7UZwb6MtDeLvMFSuAM-Vf4hCuzV_fcbY-QgcK6h1Kyxhlcx6qc1WAtiusbzlnIOvKJHAjjPsDMCoQwCLsX3jkbqE7SnL77XkYE8_QzaKluhm70pCQ1AP7Enncf7Rw1I6WoFj9257wvs"},
]


def seed_database(session: Session) -> None:
    from sqlmodel import select

    existing = session.exec(select(Category)).first()
    if existing:
        return  # already seeded

    cats = []
    for c in SEED_CATEGORIES:
        cat = Category(**c)
        session.add(cat)
        cats.append(cat)
    session.commit()
    for cat in cats:
        session.refresh(cat)

    for item_data in SEED_ITEMS:
        session.add(MenuItem(**item_data))
    session.commit()


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Lifespan: Starting up...")
    try:
        create_db_and_tables()
        print("Lifespan: Database tables checked/created.")
        with Session(engine) as session:
            seed_database(session)
        print("Lifespan: Database seeding completed.")
    except Exception as e:
        print(f"Lifespan Error: {str(e)}")
    yield


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files
app.mount("/static", StaticFiles(directory=UPLOAD_DIR.parent), name="static")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/api/debug")
def debug_info():
    db_status = "unknown"
    db_error = None
    try:
        from sqlmodel import select
        with Session(engine) as session:
            session.exec(select(Category)).first()
            db_status = "connected"
    except Exception as e:
        db_status = "error"
        db_error = str(e)

    return {
        "status": "online",
        "database": db_status,
        "database_error": db_error,
        "database_url_masked": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "local",
        "python_version": sys.version,
        "sys_path": sys.path
    }


# -- Image upload --

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Accept any image file and return its public URL."""
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Only image files are accepted. Got: '{content_type}'"
        )

    # Derive a safe extension from the uploaded filename, normalising
    # Windows-specific variants like .jfif and .jpe to .jpg.
    raw_suffix = Path(file.filename or "").suffix.lower()
    EXT_MAP = {
        ".jfif": ".jpg", ".jpe": ".jpg", ".jpg": ".jpg",
        ".jpeg": ".jpg", ".png": ".png", ".webp": ".webp",
        ".gif": ".gif",  ".bmp": ".bmp",
    }
    suffix = EXT_MAP.get(raw_suffix, ".jpg")

    filename = f"{uuid.uuid4().hex}{suffix}"
    content = await file.read()

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if supabase_url and supabase_key:
        # ── Supabase Storage (Vercel / production) ──────────────────
        import httpx
        bucket = "menu-images"
        storage_url = f"{supabase_url}/storage/v1/object/{bucket}/{filename}"
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": content_type or "image/jpeg",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(storage_url, content=content, headers=headers)
            if r.status_code not in (200, 201):
                raise HTTPException(status_code=502, detail=f"Supabase Storage error: {r.text}")
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{filename}"
        return {"url": public_url}
    else:
        # ── Local filesystem fallback ───────────────────────────────
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        dest = UPLOAD_DIR / filename
        dest.write_bytes(content)
        return {"url": f"/static/uploads/{filename}"}



# -- Categories --

@app.get("/api/categories", response_model=list[CategoryRead])
def list_categories(svc: MenuService = Depends(get_menu_service)):
    return svc.get_all_categories()


@app.post("/api/categories", response_model=CategoryRead, status_code=201)
def create_category(payload: CategoryCreate, session: Session = Depends(get_session)):
    cat = Category(**payload.model_dump())
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


@app.delete("/api/categories/{cat_id}", status_code=204)
def delete_category(cat_id: int, session: Session = Depends(get_session)):
    cat = session.get(Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    session.delete(cat)
    session.commit()


# -- SubCategories --

@app.get("/api/subcategories", response_model=list[SubCategoryRead])
def list_subcategories(
    category_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    from sqlmodel import select
    q = select(SubCategory)
    if category_id is not None:
        q = q.where(SubCategory.category_id == category_id)
    return session.exec(q).all()


@app.post("/api/subcategories", response_model=SubCategoryRead, status_code=201)
def create_subcategory(payload: SubCategoryCreate, session: Session = Depends(get_session)):
    sub = SubCategory(**payload.model_dump())
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return sub


@app.delete("/api/subcategories/{sub_id}", status_code=204)
def delete_subcategory(sub_id: int, session: Session = Depends(get_session)):
    sub = session.get(SubCategory, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    session.delete(sub)
    session.commit()


# -- Menu items --

@app.get("/api/menu", response_model=list[MenuItemRead])
def list_menu(
    category_id: Optional[int] = None,
    svc: MenuService = Depends(get_menu_service),
):
    items = svc.get_menu_items(category_id)
    result = []
    for item in items:
        data = MenuItemRead.model_validate(item)
        data.category_name = item.category.name if item.category else None
        result.append(data)
    return result


@app.post("/api/menu", response_model=MenuItemRead, status_code=201)
def create_menu_item(
    payload: MenuItemCreate,
    svc: MenuService = Depends(get_menu_service),
):
    item = MenuItem(**payload.model_dump())
    return svc.create_item(item)


@app.delete("/api/menu/{item_id}", status_code=204)
def delete_menu_item(item_id: int, svc: MenuService = Depends(get_menu_service)):
    if not svc.delete_item(item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@app.put("/api/menu/{item_id}", response_model=MenuItemRead)
def update_menu_item(
    item_id: int,
    payload: MenuItemCreate,
    svc: MenuService = Depends(get_menu_service),
):
    item = svc.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    updated = svc.update_item(item)
    data = MenuItemRead.model_validate(updated)
    data.category_name = updated.category.name if updated.category else None
    return data


# -- Analytics / Click Tracking --

class ClickTrack(BaseModel):
    item_id: Optional[int] = None

@app.post("/api/analytics/track")
def track_click(payload: ClickTrack, session: Session = Depends(get_session)):
    """Record a FoodPanda redirect click."""
    event = ClickEvent(item_id=payload.item_id)
    session.add(event)
    session.commit()
    return {"ok": True}


@app.get("/api/analytics/clicks")
def get_click_stats(session: Session = Depends(get_session)):
    """Return total clicks and per-item click counts."""
    from sqlmodel import select, func
    all_events = session.exec(select(ClickEvent)).all()
    total = len(all_events)
    per_item: dict = {}
    for e in all_events:
        key = str(e.item_id or "shop")
        per_item[key] = per_item.get(key, 0) + 1
    return {"total_clicks": total, "per_item": per_item}


# -- Orders (REMOVED — redirecting to FoodPanda) --
# All order endpoints removed. Orders are now handled externally via FoodPanda.


# -- Dashboard (legacy stub for admin compatibility) --

@app.get("/api/dashboard/stats")
def dashboard_stats_stub(session: Session = Depends(get_session)):
    """Stub: returns click analytics for the admin dashboard."""
    from sqlmodel import select
    all_events = session.exec(select(ClickEvent)).all()
    return {"total_clicks": len(all_events), "orders": 0, "revenue": 0}





# Serve frontend as static files (Local dev fallback)
if FRONTEND_DIR.exists() and not os.environ.get("VERCEL"):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
