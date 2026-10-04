
const tableSelect =
        document.getElementById("table-select");

const loadButton =
        document.getElementById("load-bill");

const billContainer =
        document.getElementById("bill-container");

async function loadBill() {

    const tableNumber = tableSelect.value;

    billContainer.innerHTML =
        "Đang tải hóa đơn...";

    try {

        const response = await fetch(
            `/api/tables/${tableNumber}/bill`
        );

        const bill = await response.json();

        if (!response.ok) {
            throw new Error(
                bill.error || "Không thể tải hóa đơn."
            );
        }

        renderBill(bill);

    } catch (error) {

        console.error(error);

        billContainer.innerHTML =
            `<p>${error.message}</p>`;
    }
}

function renderBill(bill) {

    let ordersHtml = "";

    if (bill.orders.length === 0) {

        ordersHtml =
            "<p>Chưa có order COMPLETED.</p>";

    } else {

        for (const order of bill.orders) {

            let itemsHtml = "";

            for (const item of order.items) {

                itemsHtml += `
                    <div class="item-row">

                        ${item.foodName}
                        -
                        ${formatMoney(item.unitPrice)}
                        x ${item.quantity}
                        =
                        ${formatMoney(item.itemTotal)}

                    </div>
                `;
            }

            ordersHtml += `
                <div class="order-row">

                    <h3>
                        Order #${order.orderId}
                    </h3>

                    ${itemsHtml}

                    <div class="order-total">
                        Tổng order:
                        ${formatMoney(order.total)}
                    </div>

                    <hr>

                </div>
            `;
        }
    }

    billContainer.innerHTML = `
        <div class="bill-card">

            <h2>Bàn ${bill.tableNumber}</h2>

            <p>
                Session ID:
                ${bill.sessionId}
            </p>

            <hr>

            ${ordersHtml}

            <div class="total">
                Tổng cộng:
                ${formatMoney(bill.totalAmount)}
            </div>

            <button
                class="pay-button"
                onclick="payBill(${bill.tableNumber})">
                Thanh toán
            </button>

        </div>
    `;
}
async function payBill(tableNumber) {

    const confirmed = confirm(
        `Xác nhận khách bàn ${tableNumber} đã thanh toán?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/api/tables/${tableNumber}/close`,
            {
                method: "PATCH"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Không thể thanh toán."
            );
        }

        alert("Thanh toán thành công.");

        billContainer.innerHTML = `
            <p>
                Bàn ${tableNumber} đã thanh toán
                và session đã được đóng.
            </p>
        `;

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}
function formatMoney(amount) {

    return Number(amount).toLocaleString(
        "vi-VN"
    ) + " VND";
}

loadButton.addEventListener(
        "click",
        loadBill
);