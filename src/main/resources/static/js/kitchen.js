const API_URL = "/api/orders";

// Convert an order timestamp into relative time
function getTimeAgo(timestamp) {

    if (!timestamp) {
        return "";
    }

    const time = new Date(timestamp).getTime();

    if (Number.isNaN(time)) {
        return "";
    }

    const minutes = Math.max(
        0,
        Math.floor((Date.now() - time) / 60000)
    );

    if (minutes < 1) {
        return "just now";
    }

    if (minutes === 1) {
        return "1 minute ago";
    }

    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours === 1) {
        return "1 hour ago";
    }

    return `${hours} hours ago`;
}


// Create an order card
function createOrderCard(order) {

    const card = document.createElement("div");
    card.className = "order-card";

    // Order header
    const header = document.createElement("div");
    header.className = "order-header";

    header.textContent =
        `Bàn ${order.tableNumber} (#${order.orderId})`;

    // Show order age if timestamp is available
    const timeAgo = getTimeAgo(order.createdAt);

    if (timeAgo) {
        const time = document.createElement("span");
        time.className = "order-time";
        time.textContent = ` (${timeAgo})`;

        header.appendChild(time);
    }

    card.appendChild(header);


    // Group same dishes next to each other
    const itemGroups = new Map();

    for (const item of (order.items || [])) {

    const key = item.foodName.trim().toLowerCase();

    if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
    }

    itemGroups.get(key).push(item);
}

    // Display dishes
    for (const group of itemGroups.values()) {

        for (const item of group) {

            const itemDiv = document.createElement("div");
            itemDiv.className = "order-item";

            // Quantity and name
            const itemName = document.createElement("div");
            itemName.className = "order-item-name";

            itemName.textContent =
                `${item.quantity}x ${item.foodName}`;

            itemDiv.appendChild(itemName);


            // Only display notes if they exist
            if (
                typeof item.note === "string" &&
                item.note.trim() !== ""
            ) {

                const note = document.createElement("div");
                note.className = "order-item-note";

                note.textContent =
                    `Ghi chú: ${item.note.trim()}`;

                itemDiv.appendChild(note);
            }

            card.appendChild(itemDiv);
        }
    }



    // Complete button
    const completeButton = document.createElement("button");

    completeButton.className = "complete-button";
    completeButton.textContent = "Complete";
    completeButton.type = "button";

    completeButton.addEventListener("click", async () => {

        completeButton.disabled = true;

        try {
            await completeOrder(order.orderId);
        } finally {
            completeButton.disabled = false;
        }

    });

    card.appendChild(completeButton);

    return card;
}


// Load orders from API
async function loadOrders() {

    const container =
        document.getElementById("orders-container");

    try {

        const response = await fetch(
            `${API_URL}?status=PREPARED`
        );

        if (!response.ok) {
            throw new Error("Không thể tải danh sách đơn.");
        }

        const orders = await response.json();

        if (!Array.isArray(orders)) {
            throw new Error("Dữ liệu đơn hàng không hợp lệ.");
        }

        container.replaceChildren();

        if (orders.length === 0) {

            container.textContent =
                "Không có đơn đang chờ.";

            return;
        }

        for (const order of orders) {

            const card = createOrderCard(order);

            container.appendChild(card);
        }

    } catch (error) {

        console.error(error);

        container.textContent =
            "Không thể tải đơn hàng.";
    }
}


// Complete an order
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

        const result = await response.json()
            .catch(() => ({}));

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


// Initial load
loadOrders();