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

const params =
        new URLSearchParams(window.location.search);

const tableNumber =
        Number(params.get("table"));

let sessionId = null;


/* =========================
   LOAD SESSION
========================= */

async function loadSession() {

    if (!tableNumber) {
        throw new Error(
                "Không xác định được bàn."
        );
    }

    // Thử lấy session đang mở
    let response = await fetch(
            `/api/tables/${tableNumber}/session`
    );

    let data = await response.json();

    // Nếu bàn đã có session
    if (response.ok) {

        sessionId = data.sessionId;

        document
                .getElementById("menu-title")
                .textContent =
                `Online Menu - Bàn ${tableNumber}`;

        return;
    }


    // Nếu bàn chưa có session
    // thì tự mở session mới
    if (
        data.error ===
        "Bàn không có session đang mở."
    ) {

        response = await fetch(
                `/api/tables/${tableNumber}/open`,
                {
                    method: "POST"
                }
        );

        data = await response.json();

        if (!response.ok) {

            throw new Error(
                    data.error
                    || "Không thể mở session."
            );
        }

        sessionId = data.sessionId;

        document
                .getElementById("menu-title")
                .textContent =
                `Online Menu - Bàn ${tableNumber}`;

        return;
    }


    // Những lỗi khác
    throw new Error(
            data.error
            || "Không lấy được session."
    );
}


/* =========================
   LOAD FOODS
========================= */

async function loadFoods() {

    const container =
            document.getElementById(
                    "menu-container"
            );

    try {

        const response =
                await fetch(FOOD_API);

        if (!response.ok) {
            throw new Error(
                    "Không thể tải menu."
            );
        }

        const foods =
                await response.json();

        container.innerHTML = "";

        if (foods.length === 0) {

            container.innerHTML =
                    "<p>Không có món.</p>";

            return;
        }


        for (const food of foods) {

            const imageUrl =
                    FOOD_IMAGES[food.name]
                    || "/images/default-food.jpg";

            const card =
                    document.createElement("div");

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

                        ${Number(food.price)
                            .toLocaleString("vi-VN")}đ

                    </div>


                    <div class="food-order-controls">

                        <div class="input-group">

                            <label>
                                Số lượng
                            </label>

                            <input
                                type="number"
                                id="qty-${food.id}"
                                value="1"
                                min="1"
                            >

                        </div>


                        <div class="input-group">

                            <label>
                                Ghi chú
                            </label>

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

        container.innerHTML =
                "<p>Không thể tải menu.</p>";
    }
}


/* =========================
   ADD TO CART
========================= */

function addToCart(
        foodId,
        foodName,
        foodPrice
) {

    const quantity = Number(
            document
                    .getElementById(
                            `qty-${foodId}`
                    )
                    .value
    );


    const note =
            document
                    .getElementById(
                            `note-${foodId}`
                    )
                    .value;


    const existingItem =
            cart.find(
                    item =>
                        item.foodId === foodId
            );


    if (existingItem) {

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
}


/* =========================
   RENDER CART
========================= */

function renderCart() {

    const container =
            document.getElementById(
                    "cart-container"
            );


    if (cart.length === 0) {

        container.innerHTML =
                "Chưa chọn món.";

        return;
    }


    container.innerHTML = "";

    let totalAmount = 0;


    for (const item of cart) {

        const itemTotal =
                item.price
                * item.quantity;


        totalAmount += itemTotal;


        const div =
                document.createElement("div");

        div.className =
                "cart-item";


        div.innerHTML = `

            <strong>
                ${item.foodName}
            </strong>

            x ${item.quantity}

            <br>

            Giá:
            ${item.price
                .toLocaleString("vi-VN")}đ

            <br>

            Thành tiền:
            ${itemTotal
                .toLocaleString("vi-VN")}đ

            ${item.note

                ? `
                    <br>
                    Ghi chú:
                    ${item.note}
                  `

                : ""
            }
        `;


        container.appendChild(div);
    }


    const totalDiv =
            document.createElement("div");


    totalDiv.className =
            "cart-total";


    totalDiv.innerHTML = `

        <hr>

        <strong>

            Tổng cộng:

            ${totalAmount
                .toLocaleString("vi-VN")}đ

        </strong>
    `;


    container.appendChild(totalDiv);
}


/* =========================
   SUBMIT ORDER
========================= */

async function submitOrder() {

    if (cart.length === 0) {

        alert(
                "Bạn chưa chọn món."
        );

        return;
    }


    const requestBody = {

        sessionId: sessionId,

        note:
            "Order từ customer menu",

        items: cart.map(
                item => ({

                    foodId:
                            item.foodId,

                    quantity:
                            item.quantity,

                    note:
                            item.note
                })
        )
    };


    try {

        const response =
                await fetch(
                        ORDER_API,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                        "application/json"
                            },

                            body:
                                    JSON.stringify(
                                            requestBody
                                    )
                        }
                );


        const result =
                await response.json();


        if (!response.ok) {

            throw new Error(
                    result.error
                    || "Không thể đặt món."
            );
        }


        alert(
                `Đặt món thành công. Order ID: ${result.orderId}`
        );


        cart.length = 0;

        renderCart();


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


/* =========================
   ORDER BUTTON
========================= */

document
        .getElementById(
                "submit-order"
        )
        .addEventListener(
                "click",
                submitOrder
        );


/* =========================
   INITIALIZE PAGE
========================= */

async function init() {

    try {

        await loadSession();

        await loadFoods();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


init();