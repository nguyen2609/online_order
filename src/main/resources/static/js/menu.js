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

const $ = id => document.getElementById(id);

const money = value =>
    Number(value).toLocaleString("vi-VN") + "đ";

const tableNumber = Number(
    new URLSearchParams(location.search).get("table")
);

const cart = [];

let sessionId = null;
let isSubmitting = false;
let nextLineId = 1;
let toastTimer;

/* Helpers */

function normalize(value) {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .trim();
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function button(text, className, action, label) {
    const node = element("button", className, text);
    node.type = "button";

    if (label) {
        node.setAttribute("aria-label", label);
    }

    node.addEventListener("click", action);
    return node;
}

function notify(message) {
    clearTimeout(toastTimer);

    $("toast").textContent = message;
    $("toast").hidden = false;

    toastTimer = setTimeout(() => {
        $("toast").hidden = true;
    }, 2500);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Phản hồi không hợp lệ từ máy chủ.");
    }

    if (!response.ok) {
        throw new Error(
            data.error || "Không thể xử lý yêu cầu."
        );
    }

    return data;
}

/* Table session */

async function loadSession() {
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
        throw new Error(
            "Không xác định được bàn. Vui lòng quét lại mã QR."
        );
    }

    $("table-label").textContent = `Bàn ${tableNumber}`;

    let data;

    try {
        data = await request(
            `/api/tables/${tableNumber}/session`
        );
    } catch (error) {
        if (error.message !== "Bàn không có session đang mở.") {
            throw error;
        }

        data = await request(
            `/api/tables/${tableNumber}/open`,
            { method: "POST" }
        );
    }

    sessionId = data.sessionId;

    if (!sessionId) {
        throw new Error("Không lấy được phiên của bàn.");
    }
}

/* Food cards */

async function loadFoods() {
    const foods = await request("/api/foods");

    $("menu-container").replaceChildren();

    for (const food of foods) {
        const card = element("article", "food-card");

        card.dataset.search = normalize(food.name);
        card.dataset.foodId = String(food.id);
        card.dataset.available = String(food.available === true);

        const available = food.available === true;

        if (!available) {
            card.classList.add("sold-out");
        }

        const image = element("img", "food-image");
        image.alt = food.name;
        image.loading = "lazy";

        const hideImage = () => {
            image.hidden = true;
            card.classList.add("no-image");
        };

        image.addEventListener("error", hideImage);

        if (FOOD_IMAGES[food.name]) {
            image.src = FOOD_IMAGES[food.name];
        } else {
            hideImage();
        }

        const content = element("div", "food-content");
        const top = element("div", "food-top");

        top.appendChild(
            element("h3", "food-name", food.name)
        );

        if (!available) {
            top.appendChild(
                element("span", "sold-out-label", "Hết món")
            );
        }

        content.append(
            top,
            element("p", "food-price", money(food.price))
        );

        // Simple note text box.
        const note = element("input", "note-input");

        note.type = "text";
        note.placeholder = "Ghi chú";
        note.hidden = !available;

        note.setAttribute(
            "aria-label",
            `Ghi chú cho ${food.name}`
        );

        // Match the counter to the dish and current note.
        const findMatchingItem = () => cart.find(
            item =>
                item.foodId === food.id &&
                item.note === note.value.trim()
        );

        // Keep keyboard focus on this food card after updating.
        const focusControl = selector => {
            const target = card.querySelector(selector);

            if (target && !target.hidden && !target.disabled) {
                target.focus();
            }
        };

        const add = button(
            available ? "+ Thêm món" : "Hết món",
            "add-button",
            () => {
                if (isSubmitting || !sessionId || !available) {
                    return;
                }

                addToCart(food, note.value.trim());
                focusControl(".menu-increase");
            },
            `Thêm ${food.name}`
        );

        add.dataset.available = String(available);

        const quantityControls = element(
            "div",
            "menu-quantity-controls"
        );

        quantityControls.hidden = true;
        quantityControls.setAttribute("role", "group");
        quantityControls.setAttribute(
            "aria-label",
            `Số lượng ${food.name}`
        );

        const decrease = button(
            "−",
            "menu-decrease",
            () => {
                if (isSubmitting || !sessionId || !available) {
                    return;
                }

                const item = findMatchingItem();

                if (!item) {
                    return;
                }

                if (item.quantity === 1) {
                    removeFromCart(item.lineId);
                    focusControl(".add-button");
                } else {
                    changeQuantity(item.lineId, -1);
                    focusControl(".menu-decrease");
                }
            },
            `Giảm số lượng ${food.name}`
        );

        const quantity = element(
            "span",
            "menu-quantity",
            "0"
        );

        quantity.setAttribute("aria-live", "polite");

        const increase = button(
            "+",
            "menu-increase",
            () => {
                if (isSubmitting || !sessionId || !available) {
                    return;
                }

                const item = findMatchingItem();

                if (!item || item.quantity >= 2147483647) {
                    return;
                }

                changeQuantity(item.lineId, 1);
                focusControl(
                    item.quantity >= 2147483647
                        ? ".menu-decrease"
                        : ".menu-increase"
                );
            },
            `Tăng số lượng ${food.name}`
        );

        quantityControls.append(
            decrease,
            quantity,
            increase
        );

        note.addEventListener("input", syncMenuControls);

        content.append(
            note,
            add,
            quantityControls
        );

        card.append(image, content);
        $("menu-container").appendChild(card);
    }

    $("page-status").textContent = foods.length
        ? ""
        : "Thực đơn hiện chưa có món.";

    filterFoods();
    renderCart();
}

function syncMenuControls() {
    document.querySelectorAll(".food-card").forEach(card => {
        const foodId = Number(card.dataset.foodId);
        const available = card.dataset.available === "true";

        const noteInput = card.querySelector(".note-input");
        const add = card.querySelector(".add-button");
        const controls = card.querySelector(".menu-quantity-controls");

        const decrease = card.querySelector(".menu-decrease");
        const increase = card.querySelector(".menu-increase");
        const quantity = card.querySelector(".menu-quantity");

        const item = cart.find(
            item =>
                item.foodId === foodId &&
                item.note === noteInput.value.trim()
        );

        const showCounter = available && Boolean(item);
        const locked = isSubmitting || !sessionId || !available;

        add.hidden = showCounter;
        add.disabled = locked;

        controls.hidden = !showCounter;
        quantity.textContent = item ? item.quantity : 0;

        decrease.disabled = locked || !item;

        increase.disabled =
            locked ||
            !item ||
            item.quantity >= 2147483647;

        noteInput.disabled = isSubmitting;
    });
}

/* Search */

function filterFoods() {
    const query = normalize($("food-search").value);
    const cards = document.querySelectorAll(".food-card");

    let count = 0;

    cards.forEach(card => {
        card.hidden = !card.dataset.search.includes(query);

        if (!card.hidden) {
            count++;
        }
    });

    $("food-count").textContent = `${count} món`;

    $("no-results").hidden =
        count > 0 || cards.length === 0;
}

/* Cart actions */

function addToCart(food, note) {
    // Merge only when both the dish and the note match.
    const existing = cart.find(
        item => item.foodId === food.id && item.note === note
    );

    if (existing) {
        if (existing.quantity >= 2147483647) {
            return;
        }

        existing.quantity++;
    } else {
        cart.push({
            lineId: nextLineId++,
            foodId: food.id,
            foodName: food.name,
            price: Number(food.price),
            quantity: 1,
            note: note
        });
    }

    renderCart();
    notify(`Đã thêm ${food.name}`);
}

function changeQuantity(lineId, amount) {
    if (isSubmitting) {
        return;
    }

    const item = cart.find(
        item => item.lineId === lineId
    );

    if (
        !item ||
        item.quantity + amount < 1 ||
        item.quantity + amount > 2147483647
    ) {
        return;
    }

    item.quantity += amount;
    renderCart();

    const row = $(`line-${lineId}`);
    const target = row.querySelector(
        amount > 0 ? ".increase" : ".decrease"
    );

    const focusTarget = target.disabled
        ? row.querySelector(".increase")
        : target;

    focusTarget.focus();
}

function removeFromCart(lineId) {
    if (isSubmitting) {
        return;
    }

    const index = cart.findIndex(
        item => item.lineId === lineId
    );

    if (index < 0) {
        return;
    }

    const [removed] = cart.splice(index, 1);

    renderCart();
    notify(`Đã xóa ${removed.foodName}`);

    const focusTarget =
        document.querySelector(".remove-button") ||
        $("order-title");

    focusTarget.focus();
}

/* Render cart */

function renderCart() {
    const container = $("cart-container");
    container.replaceChildren();

    let total = 0;
    let count = 0;

    if (!cart.length) {
        container.appendChild(
            element(
                "p",
                "empty-state",
                "Chưa chọn món. Hãy thêm món bạn thích."
            )
        );
    }

    for (const item of cart) {
        total += item.price * item.quantity;
        count += item.quantity;

        const row = element("div", "cart-item");
        row.id = `line-${item.lineId}`;

        const header = element("div", "cart-item-header");
        const info = element("div", "");

        info.append(
            element("h3", "", item.foodName),
            element(
                "span",
                "muted",
                `${money(item.price)} / phần`
            )
        );

        header.append(
            info,
            element(
                "strong",
                "",
                money(item.price * item.quantity)
            )
        );

        row.appendChild(header);

        if (item.note) {
            row.appendChild(
                element(
                    "p",
                    "cart-note",
                    `Ghi chú: ${item.note}`
                )
            );
        }

        const actions = element("div", "cart-actions");
        const controls = element("div", "quantity-controls");

        const decrease = button(
            "−",
            "decrease",
            () => changeQuantity(item.lineId, -1),
            `Giảm ${item.foodName}`
        );

        const increase = button(
            "+",
            "increase",
            () => changeQuantity(item.lineId, 1),
            `Tăng ${item.foodName}`
        );

        decrease.disabled =
            isSubmitting || item.quantity <= 1;

        increase.disabled =
            isSubmitting || item.quantity >= 2147483647;

        controls.append(
            decrease,
            element("span", "", item.quantity),
            increase
        );

        const remove = button(
            "Xóa món",
            "remove-button",
            () => removeFromCart(item.lineId),
            `Xóa ${item.foodName}`
        );

        remove.disabled = isSubmitting;

        actions.append(controls, remove);
        row.appendChild(actions);
        container.appendChild(row);
    }

    $("cart-count").textContent =
        $("bar-count").textContent = `${count} phần`;

    $("cart-total").textContent =
        $("bar-total").textContent = money(total);

    $("cart-bar").hidden = cart.length === 0;

    $("submit-order").disabled =
        !cart.length || !sessionId || isSubmitting;

    $("submit-order").textContent = isSubmitting
        ? "Đang gửi…"
        : "Đặt món";

        syncMenuControls();
}

/* Submit order */

async function submitOrder() {
    if (isSubmitting || !sessionId || !cart.length) {
        return;
    }

    isSubmitting = true;
    renderCart();

    $("cart-status").textContent =
        "Đang gửi đơn đến bếp…";

    try {
        const result = await request("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionId: sessionId,
                note: "Order từ customer menu",
                items: cart.map(item => ({
                    foodId: item.foodId,
                    quantity: item.quantity,
                    note: item.note
                }))
            })
        });

        cart.length = 0;

        $("cart-status").textContent =
            `Đã gửi đơn #${result.orderId} đến bếp. Bạn có thể gọi thêm món.`;

        notify("Đặt món thành công!");
    } catch (error) {
        $("cart-status").textContent =
            `${error.message} Giỏ hàng vẫn được giữ. Nếu mất kết nối, hãy hỏi nhân viên trước khi gửi lại để tránh trùng đơn.`;
    } finally {
        isSubmitting = false;
        renderCart();
    }
}

/* Events */

$("food-search").addEventListener("input", filterFoods);

$("submit-order").addEventListener("click", submitOrder);

$("view-cart").addEventListener("click", () => {
    $("order-title").focus({ preventScroll: true });

    $("your-order").scrollIntoView({
        block: "start"
    });
});

/* Initialize */

async function init() {
    renderCart();

    try {
        await loadSession();
        await loadFoods();
    } catch (error) {
        $("page-status").textContent = error.message;

        $("table-label").textContent = sessionId
            ? `Bàn ${tableNumber}`
            : "Kiểm tra mã QR";
    }
}

init();