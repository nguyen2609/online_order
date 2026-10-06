const FOOD_API = "/api/foods";
const ORDER_API = "/api/orders";

const FOOD_IMAGES = {
    "Cơm gà": "/images/comga.webp",
    "Bún bò": "/images/Bun-Bo-Hue-from-Huong-Giang-2011.jpg",
    "Trà đào": "/images/tradao.jpg",
    "cơm sườn": "/images/comsuon.jpg",
    "cơm chiên dương châu": "/images/comchienduongchau.jpg",
    "mochi": "/images/mochi.jpg",
    "cơm chiên bò xào": "/images/comchienboxao.jpg",
    "bò áp chảo": "/images/boapchao.png",
    "trà bí đao": "/images/trabidao.jpg",
    "trà vải": "/images/travai.jpg"
};

const cart = [];

const params = new URLSearchParams(window.location.search);
const tableNumber = Number(params.get("table"));

let sessionId = null;
let isSubmitting = false;

/* =========================
   LOAD SESSION
========================= */

async function loadSession() {
    if (!tableNumber) {
        throw new Error("Không xác định được bàn.");
    }

    // Thử lấy session đang mở.
    let response = await fetch(
        `/api/tables/${tableNumber}/session`
    );

    let data = await response.json();

    // Nếu bàn đã có session.
    if (response.ok) {
        sessionId = data.sessionId;

        document.getElementById("menu-title").textContent =
            `Online Menu - Bàn ${tableNumber}`;

        return;
    }

    // Nếu bàn chưa có session thì tự mở session mới.
    if (data.error === "Bàn không có session đang mở.") {
        response = await fetch(
            `/api/tables/${tableNumber}/open`,
            {
                method: "POST"
            }
        );

        data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Không thể mở session."
            );
        }

        sessionId = data.sessionId;

        document.getElementById("menu-title").textContent =
            `Online Menu - Bàn ${tableNumber}`;

        return;
    }

    throw new Error(
        data.error || "Không lấy được session."
    );
}

/* =========================
   LOAD FOODS
========================= */

async function loadFoods() {
    const container = document.getElementById("menu-container");

    try {
        const response = await fetch(FOOD_API);

        if (!response.ok) {
            throw new Error("Không thể tải menu.");
        }

        const foods = await response.json();

        container.innerHTML = "";

        if (foods.length === 0) {
            container.innerHTML = "<p>Không có món.</p>";
            return;
        }

        for (const food of foods) {
            const imageUrl =
                FOOD_IMAGES[food.name] || "/images/default-food.jpg";

            const card = document.createElement("div");
            card.className = "food-card";

            card.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="${food.name}"
                    class="food-image"
                >

                <div class="food-content">
                    <h3 class="food-name">
                        ${food.name}

                        ${food.name === "mochi"
                            ? `
                                <span class="best-seller">
                                    (Best Seller)
                                </span>
                              `
                            : ""
                        }
                    </h3>

                    <div class="food-price">
                        ${Number(food.price).toLocaleString("vi-VN")}đ
                    </div>

                    <div class="food-order-controls">
                        <div class="input-group">
                            <label>Số lượng</label>

                            <input
                                type="number"
                                id="qty-${food.id}"
                                value="1"
                                min="1"
                            >
                        </div>

                        <div class="input-group">
                            <label>Ghi chú</label>

                            <input
                                type="text"
                                id="note-${food.id}"
                                placeholder="Ví dụ: không hành"
                            >
                        </div>
                    </div>

                    <button
                        class="add-button"
                        onclick="addToCart(
                            ${food.id},
                            '${food.name}',
                            ${food.price}
                        )"
                    >
                        Thêm món
                    </button>
                </div>
            `;

            container.appendChild(card);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Không thể tải menu.</p>";
    }
}

/* =========================
   ADD TO CART
========================= */

function addToCart(foodId, foodName, foodPrice) {
    if (isSubmitting) return;

    const quantity = Number(
        document.getElementById(`qty-${foodId}`).value
    );

    const note = document.getElementById(`note-${foodId}`).value;

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 2147483647
    ) {
        alert("Vui lòng nhập số lượng nguyên hợp lệ, lớn hơn 0.");
        return;
    }

    const existingItem = cart.find(
        item => item.foodId === foodId
    );

    if (existingItem) {
        if (existingItem.quantity + quantity > 2147483647) {
            alert("Số lượng quá lớn.");
            return;
        }

        existingItem.quantity += quantity;

        if (note) {
            existingItem.note = note;
        }
    } else {
        cart.push({
            foodId: foodId,
            foodName: foodName,
            price: foodPrice,
            quantity: quantity,
            note: note
        });
    }

    renderCart();

    document.getElementById("cart-status").textContent =
        `Đã thêm ${quantity} phần ${foodName}.`;
}

/* =========================
   REMOVE / CHANGE QUANTITY
========================= */

// Removing a cart item does not delete it from the restaurant menu.
function removeFromCart(foodId) {
    if (isSubmitting) return;

    const index = cart.findIndex(
        item => item.foodId === foodId
    );

    if (index === -1) return;

    const [removed] = cart.splice(index, 1);

    renderCart();

    document.getElementById("cart-status").textContent =
        `Đã xóa ${removed.foodName} khỏi đơn hàng.`;

    focusCartControl(foodId, "remove");
}

function changeQuantity(foodId, change) {
    if (isSubmitting || ![-1, 1].includes(change)) return;

    const item = cart.find(
        item => item.foodId === foodId
    );

    if (!item) return;

    // Use the separate Xóa button to remove the entire dish.
    const nextQuantity = item.quantity + change;

    if (nextQuantity < 1 || nextQuantity > 2147483647) return;

    item.quantity = nextQuantity;

    renderCart();

    document.getElementById("cart-status").textContent =
        `${item.foodName}: ${item.quantity} phần.`;

    focusCartControl(
        foodId,
        change === 1 ? "increase" : "decrease"
    );
}

function focusCartControl(foodId, action) {
    const row = document.getElementById(`cart-item-${foodId}`);

    const preferred = row?.querySelector(
        `[data-action="${action}"]:not(:disabled)`
    );

    const fallback =
        row?.querySelector("button:not(:disabled)") ||
        document.querySelector("#cart-container button:not(:disabled)") ||
        document.querySelector(".add-button:not(:disabled)");

    (preferred || fallback)?.focus();
}

/* =========================
   RENDER CART
========================= */

function renderCart() {
    const container = document.getElementById("cart-container");
    container.replaceChildren();

    let totalAmount = 0;
    let totalQuantity = 0;

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "cart-empty";
        empty.textContent =
            "Chưa chọn món. Hãy thêm món yêu thích vào đơn hàng của bạn.";

        container.appendChild(empty);
    }

    for (const item of cart) {
        const itemTotal = item.price * item.quantity;

        totalAmount += itemTotal;
        totalQuantity += item.quantity;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.id = `cart-item-${item.foodId}`;

        row.innerHTML = `
            <div class="cart-item-info">
                <h3 class="cart-item-name"></h3>
                <p class="cart-unit-price"></p>
                <p class="cart-note"></p>
            </div>

            <strong class="cart-item-total"></strong>

            <div class="cart-item-actions">
                <div class="quantity-controls" role="group">
                    <button type="button" data-action="decrease">−</button>
                    <span class="cart-quantity"></span>
                    <button type="button" data-action="increase">+</button>
                </div>

                <button
                    type="button"
                    class="remove-button"
                    data-action="remove"
                >
                    Xóa món
                </button>
            </div>
        `;

        // Treat names and customer notes as text.
        row.querySelector(".cart-item-name").textContent =
            item.foodName;

        row.querySelector(".cart-unit-price").textContent =
            `${Number(item.price).toLocaleString("vi-VN")}đ / phần`;

        const note = row.querySelector(".cart-note");
        note.textContent = item.note ? `Ghi chú: ${item.note}` : "";
        note.hidden = !item.note;

        row.querySelector(".cart-item-total").textContent =
            `${itemTotal.toLocaleString("vi-VN")}đ`;

        row.querySelector(".cart-quantity").textContent =
            item.quantity;

        row.querySelector(".quantity-controls").setAttribute(
            "aria-label",
            `Số lượng ${item.foodName}`
        );

        const decrease = row.querySelector(
            '[data-action="decrease"]'
        );

        decrease.disabled = isSubmitting || item.quantity <= 1;
        decrease.setAttribute(
            "aria-label",
            `Giảm số lượng ${item.foodName}`
        );
        decrease.addEventListener(
            "click",
            () => changeQuantity(item.foodId, -1)
        );

        const increase = row.querySelector(
            '[data-action="increase"]'
        );

        increase.disabled =
            isSubmitting || item.quantity >= 2147483647;

        increase.setAttribute(
            "aria-label",
            `Tăng số lượng ${item.foodName}`
        );
        increase.addEventListener(
            "click",
            () => changeQuantity(item.foodId, 1)
        );

        const remove = row.querySelector(
            '[data-action="remove"]'
        );

        remove.disabled = isSubmitting;
        remove.setAttribute(
            "aria-label",
            `Xóa ${item.foodName} khỏi đơn hàng`
        );
        remove.addEventListener(
            "click",
            () => removeFromCart(item.foodId)
        );

        container.appendChild(row);
    }

    document.getElementById("cart-total").textContent =
        `${totalAmount.toLocaleString("vi-VN")}đ`;

    document.getElementById("cart-count").textContent =
        `${totalQuantity} phần`;

    const submit = document.getElementById("submit-order");

    submit.disabled =
        cart.length === 0 || !sessionId || isSubmitting;

    submit.textContent =
        isSubmitting ? "Đang gửi đến bếp…" : "Đặt món";

    document.querySelectorAll(".add-button").forEach(button => {
        button.disabled = isSubmitting;
    });
}

/* =========================
   SUBMIT ORDER
========================= */

async function submitOrder() {
    if (isSubmitting) return;

    if (!sessionId) {
        alert("Chưa xác định được phiên của bàn. Vui lòng tải lại trang.");
        return;
    }

    if (cart.length === 0) {
        alert("Bạn chưa chọn món.");
        return;
    }

    isSubmitting = true;
    renderCart();

    document.getElementById("cart-status").textContent =
        "Đang gửi đơn hàng đến bếp…";

    const requestBody = {
        sessionId: sessionId,
        note: "Order từ customer menu",
        items: cart.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity,
            note: item.note
        }))
    };

    try {
        const response = await fetch(ORDER_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Không thể đặt món."
            );
        }

        alert(
            `Đặt món thành công. Order ID: ${result.orderId}`
        );

        cart.length = 0;

        document.getElementById("cart-status").textContent =
            `Đã gửi đơn hàng #${result.orderId} đến bếp.`;
    } catch (error) {
        console.error(error);
        alert(error.message);

        document.getElementById("cart-status").textContent =
            "Không thể gửi đơn hàng. Các món đã chọn vẫn được giữ lại.";
    } finally {
        isSubmitting = false;
        renderCart();
    }
}

/* =========================
   ORDER BUTTON
========================= */

document.getElementById("submit-order").addEventListener(
    "click",
    submitOrder
);

/* =========================
   INITIALIZE PAGE
========================= */

async function init() {
    renderCart();

    try {
        await loadSession();
        await loadFoods();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

init();