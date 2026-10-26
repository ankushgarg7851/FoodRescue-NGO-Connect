// Get HTML elements
const search = document.querySelector(".filters input");
const filters = document.querySelectorAll(".filters select");
const cards = document.querySelectorAll(".food-card");
const result = document.querySelector(".result-text");

// Filter food cards
function filterFood() {
    let count = 0;
    const text = search.value.toLowerCase();
    const type = filters[0].value;
    const distance = filters[1].value;
    const pickup = filters[2].value;

    cards.forEach(function(card) {
        const details = card.textContent.toLowerCase();
        const foodType = card.querySelector(".food-type").textContent;
        const km = parseFloat(card.querySelector(".card-top span:last-child").textContent);
        const pickupDetails = card.querySelector(".food-details").textContent;

        let show = details.includes(text);

        if (type !== "All Food Types" && foodType !== type) {
            show = false;
        }

        if (distance === "Within 5 km" && km > 5) {
            show = false;
        }

        if (distance === "Within 10 km" && km > 10) {
            show = false;
        }

        if (pickup === "Urgent Pickup" && !card.querySelector(".urgent")) {
            show = false;
        }

        if (pickup === "Available Today" && !pickupDetails.includes("Today")) {
            show = false;
        }

        if (pickup === "Available Tomorrow" && !pickupDetails.includes("Tomorrow")) {
            show = false;
        }

        card.style.display = show ? "block" : "none";

        if (show) {
            count++;
        }
    });

    result.textContent = "Showing " + count + " food donations";
}

// Search food
search.addEventListener("input", filterFood);

// Apply selected filters
filters.forEach(function(filter) {
    filter.addEventListener("change", filterFood);
});

// Request food button
cards.forEach(function(card) {
    const button = card.querySelector("button");

    button.addEventListener("click", function() {
        let message = card.querySelector(".request-message");

        if (!message) {
            message = document.createElement("p");
            message.className = "request-message";
            button.after(message);
        }

        message.textContent = "Request selected! Contact the donor to confirm.";
        message.style.color = "#0f766e";
        message.style.fontSize = "12px";
        message.style.marginTop = "10px";
    });
});

// Show initial result
filterFood();
