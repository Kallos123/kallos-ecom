#!/usr/bin/env bash
BASE="http://localhost:3000/api/v1"
PASS=0; FAIL=0; SKIP=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

check() {
  local label="$1" expected="$2" method="$3" url="$4"
  shift 4
  local resp
  resp=$(curl -s -w "\n%{http_code}" "$@" -X "$method" "$url" 2>/dev/null)
  local body code
  body=$(echo "$resp" | head -n -1)
  code=$(echo "$resp" | tail -1)
  if [[ "$code" == "$expected" ]]; then
    echo -e "${GREEN}  PASS${RESET} [$code] $label"
    ((PASS++))
  else
    echo -e "${RED}  FAIL${RESET} [$code] $label"
    echo "       $(echo "$body" | head -c 250)"
    ((FAIL++))
  fi
}

# ── AUTH ──────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ AUTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kallos.in","password":"Admin@1234"}')
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}  PASS${RESET} [200] POST /auth/login — token acquired"
  ((PASS++))
else
  echo -e "${RED}  FAIL${RESET} POST /auth/login — no token; aborting"
  echo "$LOGIN"
  exit 1
fi

A=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# ── CATEGORIES ────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /categories" 200 GET "$BASE/categories"
check "GET    /categories/subcategories" 200 GET "$BASE/categories/subcategories"

CAT_DATA=$(curl -s "$BASE/categories")
CAT_ID=$(echo "$CAT_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CAT_SLUG=$(echo "$CAT_DATA" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)

check "GET    /categories/:id" 200 GET "$BASE/categories/$CAT_ID"
check "GET    /categories/slug/:slug" 200 GET "$BASE/categories/slug/$CAT_SLUG"

SUB_DATA=$(curl -s "$BASE/categories/subcategories")
SUB_ID=$(echo "$SUB_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
SUB_SLUG=$(echo "$SUB_DATA" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
check "GET    /categories/subcategories/slug/:slug" 200 GET "$BASE/categories/subcategories/slug/$SUB_SLUG"

NEW_CAT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/categories" "${A[@]}" \
  -d '{"name":"__API Test Cat","description":"temp"}')
NEW_CAT_CODE=$(echo "$NEW_CAT" | tail -1)
NEW_CAT_BODY=$(echo "$NEW_CAT" | head -n -1)
NEW_CAT_ID=$(echo "$NEW_CAT_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ "$NEW_CAT_CODE" == "201" && -n "$NEW_CAT_ID" ]]; then
  echo -e "${GREEN}  PASS${RESET} [201] POST   /categories"
  ((PASS++))
else
  echo -e "${RED}  FAIL${RESET} [$NEW_CAT_CODE] POST /categories — $NEW_CAT_BODY"
  ((FAIL++))
fi

if [ -n "$NEW_CAT_ID" ]; then
  check "PATCH  /categories/:id" 200 PATCH "$BASE/categories/$NEW_CAT_ID" "${A[@]}" \
    -d '{"name":"__API Test Cat Updated"}'

  NEW_SUB=$(curl -s -w "\n%{http_code}" -X POST "$BASE/categories/subcategories" "${A[@]}" \
    -d "{\"name\":\"__API Test Sub\",\"categoryId\":\"$NEW_CAT_ID\"}")
  NEW_SUB_CODE=$(echo "$NEW_SUB" | tail -1)
  NEW_SUB_BODY=$(echo "$NEW_SUB" | head -n -1)
  NEW_SUB_ID=$(echo "$NEW_SUB_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [[ "$NEW_SUB_CODE" == "201" && -n "$NEW_SUB_ID" ]]; then
    echo -e "${GREEN}  PASS${RESET} [201] POST   /categories/subcategories"
    ((PASS++))
  else
    echo -e "${RED}  FAIL${RESET} [$NEW_SUB_CODE] POST /categories/subcategories — $NEW_SUB_BODY"
    ((FAIL++))
  fi

  if [ -n "$NEW_SUB_ID" ]; then
    check "PATCH  /categories/subcategories/:id" 200 PATCH "$BASE/categories/subcategories/$NEW_SUB_ID" "${A[@]}" \
      -d '{"name":"__API Test Sub Updated"}'
    check "DELETE /categories/subcategories/:id" 200 DELETE "$BASE/categories/subcategories/$NEW_SUB_ID" "${A[@]}"
  fi

  check "DELETE /categories/:id" 200 DELETE "$BASE/categories/$NEW_CAT_ID" "${A[@]}"
fi

# ── PRODUCTS ──────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /products" 200 GET "$BASE/products"
check "GET    /products?category=:id" 200 GET "$BASE/products?category=$CAT_ID"
check "GET    /products?subcategory=:id" 200 GET "$BASE/products?subcategory=$SUB_ID"
check "GET    /products?category=:id&subcategory=:id" 200 GET "$BASE/products?category=$CAT_ID&subcategory=$SUB_ID"
check "GET    /products/featured" 200 GET "$BASE/products/featured"

PROD_DATA=$(curl -s "$BASE/products")
PROD_ID=$(echo "$PROD_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "GET    /products/:id" 200 GET "$BASE/products/$PROD_ID"

TS=$(date +%s)
NEW_PROD=$(curl -s -w "\n%{http_code}" -X POST "$BASE/products" "${A[@]}" \
  -d "{\"name\":\"__API Test Product\",\"description\":\"Test from API script\",\"basePrice\":499,\"categoryId\":\"$CAT_ID\",\"subcategoryId\":\"$SUB_ID\",\"isFeatured\":false,\"isActive\":true,\"tags\":[\"test\",\"api\"],\"variants\":[{\"size\":\"M\",\"color\":\"Black\",\"colorHex\":\"#000000\",\"sku\":\"TEST-${TS}-M-BLK\",\"stock\":10}]}")
NEW_PROD_CODE=$(echo "$NEW_PROD" | tail -1)
NEW_PROD_BODY=$(echo "$NEW_PROD" | head -n -1)
NEW_PROD_ID=$(echo "$NEW_PROD_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ "$NEW_PROD_CODE" == "201" && -n "$NEW_PROD_ID" ]]; then
  echo -e "${GREEN}  PASS${RESET} [201] POST   /products"
  ((PASS++))
else
  echo -e "${RED}  FAIL${RESET} [$NEW_PROD_CODE] POST /products"
  echo "       $NEW_PROD_BODY" | head -c 300
  ((FAIL++))
fi

if [ -n "$NEW_PROD_ID" ]; then
  check "PATCH  /products/:id (name+price)" 200 PATCH "$BASE/products/$NEW_PROD_ID" "${A[@]}" \
    -d '{"name":"__API Test Product Updated","basePrice":599}'
  check "PATCH  /products/:id (clear subcategory)" 200 PATCH "$BASE/products/$NEW_PROD_ID" "${A[@]}" \
    -d '{"subcategoryId":null}'
  check "PATCH  /products/:id (set subcategory)" 200 PATCH "$BASE/products/$NEW_PROD_ID" "${A[@]}" \
    -d "{\"subcategoryId\":\"$SUB_ID\"}"
  check "PATCH  /products/:id (tags)" 200 PATCH "$BASE/products/$NEW_PROD_ID" "${A[@]}" \
    -d '{"tags":["updated","api","test"]}'

  NEW_VAR=$(curl -s -w "\n%{http_code}" -X POST "$BASE/products/$NEW_PROD_ID/variants" "${A[@]}" \
    -d "{\"size\":\"L\",\"color\":\"White\",\"colorHex\":\"#FFFFFF\",\"sku\":\"TEST-${TS}-L-WHT\",\"stock\":5}")
  NEW_VAR_CODE=$(echo "$NEW_VAR" | tail -1)
  NEW_VAR_BODY=$(echo "$NEW_VAR" | head -n -1)
  NEW_VAR_ID=$(echo "$NEW_VAR_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [[ "$NEW_VAR_CODE" == "201" && -n "$NEW_VAR_ID" ]]; then
    echo -e "${GREEN}  PASS${RESET} [201] POST   /products/:id/variants"
    ((PASS++))
  else
    echo -e "${RED}  FAIL${RESET} [$NEW_VAR_CODE] POST /products/:id/variants — $NEW_VAR_BODY"
    ((FAIL++))
  fi

  if [ -n "$NEW_VAR_ID" ]; then
    check "PATCH  /products/:id/variants/:id" 200 PATCH "$BASE/products/$NEW_PROD_ID/variants/$NEW_VAR_ID" "${A[@]}" \
      -d '{"stock":20,"price":549}'
    check "PATCH  .../variants/:id/stock (+5)" 200 PATCH "$BASE/products/$NEW_PROD_ID/variants/$NEW_VAR_ID/stock" "${A[@]}" \
      -d '{"delta":5}'
    check "PATCH  .../variants/:id/stock (-3)" 200 PATCH "$BASE/products/$NEW_PROD_ID/variants/$NEW_VAR_ID/stock" "${A[@]}" \
      -d '{"delta":-3}'
  fi

  check "DELETE /products/:id" 200 DELETE "$BASE/products/$NEW_PROD_ID" "${A[@]}"
fi

# ── USERS ─────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ USERS (ADMIN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /users" 200 GET "$BASE/users" "${A[@]}"
check "GET    /users?page=1&limit=5" 200 GET "$BASE/users?page=1&limit=5" "${A[@]}"

USERS_DATA=$(curl -s "$BASE/users" "${A[@]}")
# Get customer ID by logging in as customer and fetching profile
CUST_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"customer@kallos.in","password":"Customer@1234"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
CUST_ID=$(curl -s "$BASE/users/profile" -H "Authorization: Bearer $CUST_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$CUST_ID" ]; then
  check "PATCH  /users/:id/status (deactivate)" 200 PATCH "$BASE/users/$CUST_ID/status" "${A[@]}" \
    -d '{"isActive":false}'
  check "PATCH  /users/:id/status (reactivate)" 200 PATCH "$BASE/users/$CUST_ID/status" "${A[@]}" \
    -d '{"isActive":true}'
else
  echo -e "${YELLOW}  SKIP${RESET} PATCH /users/:id/status — no customer found"
  ((SKIP+=2))
fi

# ── WALLET ────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ WALLET (ADMIN ADJUST) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
if [ -n "$CUST_ID" ]; then
  check "POST   /wallet/admin/adjust (credit)" 200 POST "$BASE/wallet/admin/adjust" "${A[@]}" \
    -d "{\"userId\":\"$CUST_ID\",\"amount\":100,\"type\":\"CREDIT\",\"reason\":\"API test credit\"}"
  check "POST   /wallet/admin/adjust (debit)" 200 POST "$BASE/wallet/admin/adjust" "${A[@]}" \
    -d "{\"userId\":\"$CUST_ID\",\"amount\":50,\"type\":\"DEBIT\",\"reason\":\"API test debit\"}"
else
  echo -e "${YELLOW}  SKIP${RESET} Wallet adjust — no customer found"
  ((SKIP+=2))
fi

# ── COUPONS ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ COUPONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /coupons" 200 GET "$BASE/coupons" "${A[@]}"

NEW_COUP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/coupons" "${A[@]}" \
  -d '{"code":"__APITEST99","type":"PERCENTAGE","value":15,"isActive":true}')
NEW_COUP_CODE=$(echo "$NEW_COUP" | tail -1)
NEW_COUP_BODY=$(echo "$NEW_COUP" | head -n -1)
NEW_COUP_ID=$(echo "$NEW_COUP_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ "$NEW_COUP_CODE" == "201" && -n "$NEW_COUP_ID" ]]; then
  echo -e "${GREEN}  PASS${RESET} [201] POST   /coupons"
  ((PASS++))
else
  echo -e "${RED}  FAIL${RESET} [$NEW_COUP_CODE] POST /coupons — $NEW_COUP_BODY"
  ((FAIL++))
fi

if [ -n "$NEW_COUP_ID" ]; then
  check "PATCH  /coupons/:id" 200 PATCH "$BASE/coupons/$NEW_COUP_ID" "${A[@]}" \
    -d '{"value":20,"description":"Updated by API test"}'
  check "DELETE /coupons/:id" 200 DELETE "$BASE/coupons/$NEW_COUP_ID" "${A[@]}"
fi

# ── FLASH SALES ───────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ FLASH SALES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /coupons/flash-sales/active (public)" 200 GET "$BASE/coupons/flash-sales/active"
check "GET    /coupons/flash-sales" 200 GET "$BASE/coupons/flash-sales" "${A[@]}"

FS_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FS_END="2026-12-31T00:00:00Z"

NEW_FS=$(curl -s -w "\n%{http_code}" -X POST "$BASE/coupons/flash-sales" "${A[@]}" \
  -d "{\"name\":\"__API Test Sale\",\"startTime\":\"$FS_START\",\"endTime\":\"$FS_END\",\"isActive\":true}")
NEW_FS_CODE=$(echo "$NEW_FS" | tail -1)
NEW_FS_BODY=$(echo "$NEW_FS" | head -n -1)
NEW_FS_ID=$(echo "$NEW_FS_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ "$NEW_FS_CODE" == "201" && -n "$NEW_FS_ID" ]]; then
  echo -e "${GREEN}  PASS${RESET} [201] POST   /coupons/flash-sales"
  ((PASS++))
else
  echo -e "${RED}  FAIL${RESET} [$NEW_FS_CODE] POST /coupons/flash-sales — $NEW_FS_BODY"
  ((FAIL++))
fi

if [ -n "$NEW_FS_ID" ]; then
  check "GET    /coupons/flash-sales/:id" 200 GET "$BASE/coupons/flash-sales/$NEW_FS_ID" "${A[@]}"

  FEAT_PROD_ID=$(curl -s "$BASE/products/featured" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$FEAT_PROD_ID" ]; then
    FS_ITEM=$(curl -s -w "\n%{http_code}" -X POST "$BASE/coupons/flash-sales/$NEW_FS_ID/items" "${A[@]}" \
      -d "{\"productId\":\"$FEAT_PROD_ID\",\"discountType\":\"PERCENTAGE\",\"discountValue\":10}")
    FS_ITEM_CODE=$(echo "$FS_ITEM" | tail -1)
    FS_ITEM_BODY=$(echo "$FS_ITEM" | head -n -1)
    FS_ITEM_ID=$(echo "$FS_ITEM_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [[ "$FS_ITEM_CODE" == "201" && -n "$FS_ITEM_ID" ]]; then
      echo -e "${GREEN}  PASS${RESET} [201] POST   /coupons/flash-sales/:id/items"
      ((PASS++))
    else
      echo -e "${RED}  FAIL${RESET} [$FS_ITEM_CODE] POST /coupons/flash-sales/:id/items — $FS_ITEM_BODY"
      ((FAIL++))
    fi
    if [ -n "$FS_ITEM_ID" ]; then
      check "DELETE /coupons/flash-sales/:id/items/:itemId" 200 DELETE \
        "$BASE/coupons/flash-sales/$NEW_FS_ID/items/$FS_ITEM_ID" "${A[@]}"
    fi
  fi
  check "DELETE /coupons/flash-sales/:id" 200 DELETE "$BASE/coupons/flash-sales/$NEW_FS_ID" "${A[@]}"
fi

# ── ORDERS ────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ ORDERS (ADMIN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /orders/admin/all" 200 GET "$BASE/orders/admin/all" "${A[@]}"
check "GET    /orders/admin/all?status=PENDING" 200 GET "$BASE/orders/admin/all?status=PENDING" "${A[@]}"

ORDER_DATA=$(curl -s "$BASE/orders/admin/all" "${A[@]}")
ORDER_TOTAL=$(echo "$ORDER_DATA" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2 || echo 0)
echo "       ($ORDER_TOTAL orders total)"
if [ "$ORDER_TOTAL" -gt 0 ] 2>/dev/null; then
  ORDER_ID=$(echo "$ORDER_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  check "GET    /orders/admin/:id" 200 GET "$BASE/orders/admin/$ORDER_ID" "${A[@]}"
  echo -e "${YELLOW}  SKIP${RESET} PATCH /orders/admin/:id/status — skipping mutation of real orders"
  echo -e "${YELLOW}  SKIP${RESET} PATCH /orders/admin/:id/tracking — skipping mutation of real orders"
  ((SKIP+=2))
else
  echo -e "${YELLOW}  SKIP${RESET} /orders/admin/:id — no orders in DB"
  ((SKIP+=3))
fi

# ── REVIEWS ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ REVIEWS (ADMIN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /reviews" 200 GET "$BASE/reviews" "${A[@]}"
check "GET    /reviews?status=PENDING" 200 GET "$BASE/reviews?status=PENDING" "${A[@]}"

REV_DATA=$(curl -s "$BASE/reviews" "${A[@]}")
REV_COUNT=$(echo "$REV_DATA" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
echo "       ($REV_COUNT reviews)"
if [ "$REV_COUNT" -gt 0 ] 2>/dev/null; then
  REV_ID=$(echo "$REV_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  check "PATCH  /reviews/:id/moderate" 200 PATCH "$BASE/reviews/$REV_ID/moderate" "${A[@]}" \
    -d '{"status":"APPROVED"}'
else
  echo -e "${YELLOW}  SKIP${RESET} PATCH /reviews/:id/moderate — no reviews"
  ((SKIP++))
fi

# ── RETURNS ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ RETURNS (ADMIN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /returns" 200 GET "$BASE/returns" "${A[@]}"
RET_COUNT=$(curl -s "$BASE/returns" "${A[@]}" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
echo "       ($RET_COUNT returns)"
echo -e "${YELLOW}  SKIP${RESET} PATCH /returns/:id/process — no test returns to safely mutate"
((SKIP++))

# ── ANALYTICS ─────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ ANALYTICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /analytics/summary" 200 GET "$BASE/analytics/summary" "${A[@]}"
check "GET    /analytics/sales" 200 GET "$BASE/analytics/sales" "${A[@]}"
check "GET    /analytics/revenue-trend" 200 GET "$BASE/analytics/revenue-trend" "${A[@]}"
check "GET    /analytics/top-products" 200 GET "$BASE/analytics/top-products" "${A[@]}"
check "GET    /analytics/low-stock" 200 GET "$BASE/analytics/low-stock" "${A[@]}"
check "GET    /analytics/orders/status" 200 GET "$BASE/analytics/orders/status" "${A[@]}"
check "GET    /analytics/orders/payment-methods" 200 GET "$BASE/analytics/orders/payment-methods" "${A[@]}"
check "GET    /analytics/customers" 200 GET "$BASE/analytics/customers" "${A[@]}"
check "GET    /analytics/returns" 200 GET "$BASE/analytics/returns" "${A[@]}"

# ── SHIPPING ──────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━ SHIPPING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
check "GET    /shipping/serviceability/560001" 200 GET "$BASE/shipping/serviceability/560001"
echo -e "${YELLOW}  SKIP${RESET} POST /shipping/orders/:id/ship — requires live Delhivery integration"
((SKIP++))

# ── SUMMARY ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}   ${RED}FAIL: $FAIL${RESET}   ${YELLOW}SKIP: $SKIP${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
