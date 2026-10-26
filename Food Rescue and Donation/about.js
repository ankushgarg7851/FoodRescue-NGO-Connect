
document.addEventListener("DOMContentLoaded", function () {

    // Login button
    const loginButton = document.querySelector(".login");

    loginButton.addEventListener("click", function () {
        let name = prompt("Please enter your name:");

        if (name === null) {
            return;
        }

        name = name.trim();

        if (name === "") {
            alert("Please enter your name.");
        } else {
            alert("Hello " + name +
                "! Welcome to FoodRescue.");
            alert("Login and Sign Up feature coming soon!");
        }
    });

    // Difference section boxes
    const boxes = document.querySelectorAll(".difference-box");

    boxes.forEach(function (box) {
        box.addEventListener("click", function () {

            boxes.forEach(function (item) {
                item.style.backgroundColor = "white";
                item.style.borderColor = "#d8e0e5";
            });

            box.style.backgroundColor = "#dff5f1";
            box.style.borderColor = "#087f78";
        });
    });

    // Add copyright year to footer
    const footerAbout = document.querySelector(".footer-about");
    const yearText = document.createElement("p");

    yearText.textContent = "Copyright " +
        new Date().getFullYear() + " FoodRescue";

    footerAbout.appendChild(yearText);

    // Create a Back to Top button
    const topButton = document.createElement("button");

    topButton.textContent = "Back to Top";
    topButton.style.position = "fixed";
    topButton.style.bottom = "20px";
    topButton.style.right = "20px";
    topButton.style.padding = "12px";
    topButton.style.backgroundColor = "#087f78";
    topButton.style.color = "white";
    topButton.style.border = "none";
    topButton.style.borderRadius = "5px";
    topButton.style.cursor = "pointer";
    topButton.style.display = "none";

    document.body.appendChild(topButton);

    // Show button when scrolling
    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            topButton.style.display = "block";
        } else {
            topButton.style.display = "none";
        }
    });

    // Scroll to the top
    topButton.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

});
