// FoodRescue Blog JavaScript

// Select HTML elements
const buttons = document.querySelectorAll(".filter-btn");
const articles = document.querySelectorAll(".featured-card, .blog-card");
const searchBox = document.querySelector(".search-box input");
const form = document.querySelector(".cta-form");
let selectedCategory = "All Stories";

// Create a message for no results
const message = document.createElement("p");
message.textContent = "No articles found!";
message.style.display = "none";
document.querySelector(".blog-grid").after(message);

// Function to filter articles
function filterArticles() {
    let searchText = searchBox.value.toLowerCase().trim();
    let count = 0;

    articles.forEach(function(article) {
        let categoryElement = article.querySelector(
            ".image-tag, .category-tag"
        );

        let category = categoryElement.textContent.toLowerCase();
        let categoryMatch =
            selectedCategory === "All Stories" ||
            category === selectedCategory.toLowerCase();

        let searchMatch = article.textContent
            .toLowerCase().includes(searchText);

        let showArticle = categoryMatch && searchMatch;

        let container = article.classList.contains("featured-card")
            ? article.closest(".featured-wrapper")
            : article;

        container.style.display = showArticle ? "" : "none";

        if (showArticle) {
            count++;
        }
    });

    message.style.display = count === 0 ? "block" : "none";
}

// Add click events to category buttons
buttons.forEach(function(button) {
    button.addEventListener("click", function() {
        selectedCategory = button.textContent.trim();

        buttons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        filterArticles();
    });
});

// Search articles while typing
searchBox.addEventListener("input", function() {
    filterArticles();
});

// Handle newsletter subscription
form.addEventListener("submit", function(event) {
    event.preventDefault();

    let email = form.querySelector('input[type="email"]');

    if (email.value.trim() === "" || !email.checkValidity()) {
        alert("Please enter a valid email address.");
        return;
    }

    alert("Thank you for subscribing to FoodRescue!");

    form.reset();
});