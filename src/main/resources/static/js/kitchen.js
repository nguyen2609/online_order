const API_URL = "/api/orders";

async function loadOrders() {
    const container = document.getElementById("orders-container");

    try {
        const response = await fetch(
            `${API_URL}?status=PREPARED`
        );

        if (!response.ok) {
            throw new Error("Không thể tải danh sách đơn.");
        }

        const orders = await response.json();

        container.innerHTML = "";

        if (orders.length === 0) {
            container.innerHTML = "<p>Không có đơn đang chờ.</p>";
            return;
        }

        for (const order of orders) {
            const card = document.createElement("div");
            card.className = "order-card";

            let itemsHtml = "";

            for (const item of order.items) {
                itemsHtml += `
                    <div class="order-item">
                        <strong>${item.foodName}</strong>
                        x ${item.quantity}
                        <br>
                        ${item.note ? `Ghi chú: ${item.note}` : ""}
                    </div>
                `;
            }

            card.innerHTML = `
                <h2>Order #${order.orderId}</h2>

                <p>
                    <strong>Bàn:</strong>
                    ${order.tableNumber}
                </p>

                <p>
                    <strong>Trạng thái:</strong>
                    ${order.status}
                </p>

                <p>
                    <strong>Ghi chú đơn:</strong>
                    ${order.note ?? "Không có"}
                </p>

                <div>
                    ${itemsHtml}
                </div>

                <button
                    onclick="completeOrder(${order.orderId})"
                >
                    Completed
                </button>
            `;

            container.appendChild(card);
        }

    } catch (error) {
        console.error(error);

        container.innerHTML =
            "<p>Không thể tải đơn hàng.</p>";
    }
}

async function completeOrder(orderId) {

    try {
        const response = await fetch(
            `${API_URL}/${orderId}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "COMPLETED"
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Không thể cập nhật đơn."
            );
        }

        await loadOrders();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

loadOrders();