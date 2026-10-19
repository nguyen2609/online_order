const $ = id => document.getElementById(id);

const tableSelect = $("table-select");
const loadButton = $("load-bill");
const billContainer = $("bill-container");
const connectionMessage = $("connection-message");
const actionMessage = $("action-message");
const closeDialog = $("close-dialog");

let busy = false;
let currentBill = null;
let lastUpdatedAt = null;

let refreshTimer;

function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(loadBill, 10000);
}

/* Create text safely, including dish names. */
function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function formatMoney(amount) {
    return Number(amount).toLocaleString("vi-VN") + " VND";
}

function setBusy(value) {
    busy = value;

    tableSelect.disabled = value;
    loadButton.disabled = value;

    billContainer.setAttribute("aria-busy", String(value));

    billContainer.querySelectorAll("button").forEach(button => {
        button.disabled = value || !currentBill;
    });
}

/* Updates the elapsed time without making another API request. */
function updateConnectionMessage() {
    if (lastUpdatedAt === null) {
        return;
    }

    const time = new Date(lastUpdatedAt).toLocaleTimeString("en-GB");

    const seconds = Math.max(
        0,
        Math.floor((Date.now() - lastUpdatedAt) / 1000)
    );

    const unit = seconds === 1 ? "second" : "seconds";

    connectionMessage.textContent =
        `Updated at ${time} - ${seconds} ${unit} ago`;
}

/* API request with a 10-second timeout. */
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
            const noSession =
                data.error === "Bàn không có session đang mở.";

            throw new Error(
                noSession
                    ? "This table has no open session."
                    : "The request failed. Please try again."
            );
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

/* Display the bill returned by the existing backend. */
function renderBill(bill) {
    const card = element("article", "bill-card");
    const header = element("header", "bill-header");

    header.append(
        element("h2", "", `Table ${bill.tableNumber}`),
        element("p", "session-number", `Session #${bill.sessionId}`)
    );

    card.append(
        header,
        element(
            "p",
            "bill-note",
            "This bill includes completed orders only."
        )
    );

    if (!bill.orders.length) {
        card.append(
            element("p", "", "No completed orders yet.")
        );
    }

    for (const order of bill.orders) {
        const section = element("section", "order-row");

        section.append(
            element("h3", "", `Order #${order.orderId}`)
        );

        const list = element("ul", "order-items");

        for (const item of order.items) {
            const row = element("li", "item-row");
            const details = element("div", "item-details");
            const line = element("div", "dish-line");

            line.append(
                element(
                    "strong",
                    "dish-quantity",
                    `${item.quantity}×`
                ),
                element("span", "", item.foodName)
            );

            details.append(
                line,
                element(
                    "span",
                    "unit-price",
                    `${formatMoney(item.unitPrice)} each`
                )
            );

            row.append(
                details,
                element(
                    "strong",
                    "item-total",
                    formatMoney(item.itemTotal)
                )
            );

            list.append(row);
        }

        const subtotal = element("div", "order-total");

        subtotal.append(
            element("span", "", "Order total"),
            element("strong", "", formatMoney(order.total))
        );

        section.append(list, subtotal);
        card.append(section);
    }

    const total = element("div", "bill-total");

    total.append(
        element("span", "", "Total"),
        element("strong", "", formatMoney(bill.totalAmount))
    );

    const button = element(
        "button",
        "primary-button end-session-button",
        "End table session"
    );

    button.type = "button";
    button.addEventListener("click", endSession);

    card.append(total, button);
    billContainer.replaceChildren(card);

    currentBill = bill;
    lastUpdatedAt = Date.now();

    loadButton.textContent = "Refresh bill";

    updateConnectionMessage();
    setBusy(busy);
}

async function loadBill() {
    if (busy) {
        return;
    }

    clearTimeout(refreshTimer);
    setBusy(true);

    actionMessage.textContent = "";
    lastUpdatedAt = null;
    connectionMessage.textContent = "Loading bill…";

    try {
        const bill = await request(
            `/api/tables/${tableSelect.value}/bill`
        );

        renderBill(bill);
    } catch (error) {
        currentBill = null;
        connectionMessage.textContent = "Bill unavailable.";

        const message = error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error.message;

        billContainer.replaceChildren(
            element("p", "empty-message", message)
        );
    } finally {
        setBusy(false);
        scheduleRefresh();
    }
}

/* Cancel or Escape returns false. */
function confirmEndSession(bill) {
    $("close-table").textContent = `Table ${bill.tableNumber}`;
    $("close-total").textContent = formatMoney(bill.totalAmount);

    closeDialog.returnValue = "";

    return new Promise(resolve => {
        closeDialog.addEventListener(
            "close",
            () => {
                resolve(closeDialog.returnValue === "confirm");
            },
            { once: true }
        );

        closeDialog.showModal();
    });
}

async function endSession() {
    if (busy || !currentBill) {
        return;
    }

    const bill = currentBill;

    // Pause automatic refreshing during confirmation and closing.
    clearTimeout(refreshTimer);
    setBusy(true);
    actionMessage.textContent = "";

    try {
        const confirmed = await confirmEndSession(bill);

        if (!confirmed) {
            return;
        }

        // Another device may have updated the bill or table session.
        const latest = await request(
            `/api/tables/${bill.tableNumber}/bill`
        );

        if (JSON.stringify(latest) !== JSON.stringify(bill)) {
            renderBill(latest);

            actionMessage.textContent =
                "The bill or session has changed. " +
                "Review the updated bill before ending the session.";

            return;
        }

        await request(
            `/api/tables/${bill.tableNumber}/close`,
            { method: "PATCH" }
        );

        currentBill = null;
        lastUpdatedAt = null;

        connectionMessage.textContent =
            "Choose a table and click View bill.";

        loadButton.textContent = "View bill";

        actionMessage.textContent =
            `Table ${bill.tableNumber}, ` +
            `session #${bill.sessionId} has ended.`;

        billContainer.replaceChildren(
            element("p", "empty-message", "No bill selected.")
        );
    } catch (error) {
        // A lost response does not prove whether closing succeeded.
        // Require a fresh bill before allowing another close attempt.
        currentBill = null;
        lastUpdatedAt = null;

        connectionMessage.textContent =
            "Refresh the bill to check the current session.";

        actionMessage.textContent =
            "Could not confirm that the session ended. " +
            "Refresh the bill before trying again.";
    } finally {
        setBusy(false);

        // Resume after cancellation or a changed bill.
        // After closing or an uncertain result, require a manual reload.
        if (currentBill) {
            scheduleRefresh();
        }

        const button = billContainer.querySelector(
            ".end-session-button"
        );

        const focusTarget = button && !button.disabled
            ? button
            : loadButton;

        focusTarget.focus();
    }
}

$("table-form").addEventListener("submit", event => {
    event.preventDefault();
    loadBill();
});

/* Clear the previous table's bill when selecting another table. */
tableSelect.addEventListener("change", () => {
    clearTimeout(refreshTimer);

    currentBill = null;
    lastUpdatedAt = null;

    actionMessage.textContent = "";

    connectionMessage.textContent =
        "Choose a table and click View bill.";

    loadButton.textContent = "View bill";

    billContainer.replaceChildren(
        element(
            "p",
            "empty-message",
            "Click View bill to load this table."
        )
    );
});

setInterval(updateConnectionMessage, 1000);