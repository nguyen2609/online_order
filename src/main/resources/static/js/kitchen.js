const API_URL = "/api/orders";

const container = document.getElementById("orders-container");
const connectionMessage = document.getElementById("connection-message");
const actionMessage = document.getElementById("action-message");
const refreshButton = document.getElementById("refresh-button");

let busy = false;
let refreshTimer;
let lastContent = null;

let lastUpdatedAt = null;
let connectionHealthy = false;

function updateConnectionMessage() {
    if (!connectionHealthy || lastUpdatedAt === null) {
        return;
    }

    const time = new Date(lastUpdatedAt).toLocaleTimeString("vi-VN");

    const seconds = Math.max(
        0,
        Math.floor((Date.now() - lastUpdatedAt) / 1000)
    );

    const elapsed = seconds === 1
        ? "1 second ago"
        : `${seconds} seconds ago`;

    connectionMessage.textContent =
        `Updated at ${time} - ${elapsed}`;
}

/* Create elements using textContent for names and notes. */
function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function setBusy(value) {
    busy = value;
    refreshButton.disabled = value;

    container.querySelectorAll("button").forEach(button => {
        button.disabled = value;
    });
}

function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(loadOrders, 5000);
}

/* API request with a timeout. */
async function request(url, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 10000);

    try {
        const response = await fetch(url, {
            ...options,
            cache: "no-store",
            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Yêu cầu không thành công."
            );
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

/* Build one order ticket. */
function createOrderCard(order) {
    const card = element("article", "order-card");

    const header = element("header", "order-header");

    const title = element(
        "h2",
        "",
        `Bàn ${order.tableNumber} `
    );

    title.appendChild(
        element(
            "span",
            "order-number",
            `(#${order.orderId})`
        )
    );

    header.appendChild(title);

    const list = element("ul", "order-items");

    // Same dishes appear next to each other.
    // Keep separate rows and quantities for different notes.
    const sortedItems = [...order.items].sort(
        (a, b) => a.foodId - b.foodId
    );

    for (const item of sortedItems) {
        const row = element("li", "order-item");
        const line = element("div", "dish-line");

        line.append(
            element(
                "strong",
                "dish-quantity",
                `${item.quantity}×`
            ),
            element(
                "span",
                "dish-name",
                item.foodName
            )
        );

        row.appendChild(line);

        const note = String(item.note ?? "").trim();

        // No note means no label and no empty note area.
        if (note) {
            row.appendChild(
                element(
                    "p",
                    "dish-note",
                    `Ghi chú: ${note}`
                )
            );
        }

        list.appendChild(row);
    }

    card.append(header, list);

    // Display meaningful order-level notes.
    const orderNote = String(order.note ?? "").trim();

    if (
        orderNote &&
        orderNote !== "Order từ customer menu"
    ) {
        card.appendChild(
            element(
                "p",
                "order-note",
                `Ghi chú đơn: ${orderNote}`
            )
        );
    }

    const button = element(
        "button",
        "complete-button",
        "Hoàn thành"
    );

    button.type = "button";

    button.setAttribute(
        "aria-label",
        `Hoàn thành đơn ${order.orderId}, bàn ${order.tableNumber}`
    );

    button.addEventListener("click", () => {
        completeOrder(
            order.orderId,  
            order.tableNumber,
            card,
            button
        );
    });

    card.appendChild(button);

    return card;
}

/* Load active kitchen orders. */
async function loadOrders() {
    if (busy) {
        return;
    }

    clearTimeout(refreshTimer);
    setBusy(true);

    try {
        const orders = await request(
            `${API_URL}?status=PREPARED`
        );

        if (!Array.isArray(orders)) {
            throw new Error("Dữ liệu đơn hàng không hợp lệ.");
        }

        // Smaller IDs first until creation timestamps are available.
        orders.sort((a, b) => a.orderId - b.orderId);

        const content = JSON.stringify(orders);

        // Keep unchanged tickets in place.
        if (content !== lastContent) {
            const fragment = document.createDocumentFragment();

            for (const order of orders) {
                fragment.appendChild(createOrderCard(order));
            }

            if (!orders.length) {
                fragment.appendChild(
                    element(
                        "p",
                        "empty-message",
                        "Không có đơn đang chờ."
                    )
                );
            }

            container.replaceChildren(fragment);
            lastContent = content;
        }

        lastUpdatedAt = Date.now();
        connectionHealthy = true;
        updateConnectionMessage();

    } catch (error) {
        connectionHealthy = false;
        
        console.error(error);

        // Preserve existing tickets if refreshing fails.
        connectionMessage.textContent =
            "Không thể tải đơn mới. Dữ liệu đang hiển thị có thể đã cũ. Đang thử kết nối lại…";

    } finally {
        setBusy(false);
        scheduleRefresh();
    }
}

function confirmCompletion(orderId, tableNumber) {
    const dialog = document.getElementById("complete-dialog");

    const dialogMessage = document.getElementById(
        "complete-dialog-message"
    );

    dialogMessage.textContent =
        `Mark order #${orderId} for Table ${tableNumber} as complete? ` +
        "This will remove it from the kitchen list.";

    // Clear the result from the previous opening.
    dialog.returnValue = "";

    return new Promise(resolve => {
        dialog.addEventListener(
            "close",
            () => {
                resolve(dialog.returnValue === "confirm");
            },
            { once: true }
        );

        dialog.showModal();
    });
}

async function completeOrder(orderId, tableNumber, card, button) {
    if (busy) {
        return;
    }

    // Pause refreshing while the customer-facing order is being confirmed.
    clearTimeout(refreshTimer);
    setBusy(true);

    let confirmed;

    try {
        confirmed = await confirmCompletion(orderId, tableNumber);
    } catch (error) {
        console.error(error);
        actionMessage.textContent =
            "Could not open the confirmation dialog. Please try again.";

        setBusy(false);
        scheduleRefresh();
        button.focus();
        return;
    }

    // Cancel or Escape: leave the order unchanged.
    if (!confirmed) {
        setBusy(false);
        scheduleRefresh();
        button.focus();
        return;
    }

    const originalButtonText = button.textContent;

    button.textContent = "Saving…";
    actionMessage.textContent = "";

    let completed = false;

    try {
        await request(`${API_URL}/${orderId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "COMPLETED"
            })
        });

        completed = true;

        card.remove();
        lastContent = null;

        actionMessage.textContent =
            `Order #${orderId} for Table ${tableNumber} completed.`;

    } catch (error) {
        console.error(error);

        actionMessage.textContent =
            `Could not confirm completion of order #${orderId}. ` +
            "Refresh the order list to check its current state.";

    } finally {
        button.textContent = originalButtonText;
        setBusy(false);
    }

    await loadOrders();

    if (completed || !button.isConnected) {
        const nextButton =
            container.querySelector(".complete-button") ||
            refreshButton;

        nextButton.focus();
    } else {
        button.focus();
    }
}

refreshButton.addEventListener("click", loadOrders);

// Update the displayed elapsed time every second.
// This does not send additional API requests.
setInterval(updateConnectionMessage, 1000);

loadOrders();