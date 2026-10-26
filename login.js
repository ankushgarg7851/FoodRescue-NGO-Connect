// Get HTML elements
const form = document.querySelector("form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const roles = document.querySelectorAll(".roles button");
const message = document.createElement("p");

// Add message area
message.style.marginTop = "15px";
message.style.fontSize = "14px";
message.style.textAlign = "center";
form.appendChild(message);

// Show message
function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
}

// Select login role
roles.forEach(function(button) {
    button.addEventListener("click", function() {
        roles.forEach(function(role) {
            role.style.backgroundColor = "#faf8f5";
            role.style.color = "#1e293b";
        });

        button.style.backgroundColor = "#0e6e66";
        button.style.color = "white";
        showMessage(button.textContent + " selected", "#0e6e66");
    });
});

// Handle login form submission
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const userEmail = email.value.trim();
    const userPassword = password.value.trim();

    if (userEmail === "" || userPassword === "") {
        showMessage("Please fill in all fields.", "red");
    }
    else if (!email.checkValidity()) {
        showMessage("Please enter a valid email.", "red");
    }
    else if (userPassword.length < 6) {
        showMessage("Password must be at least 6 characters.", "red");
    }
    else {
        showMessage("Login form submitted successfully!", "green");
    }
});

// Forgot password option
document.querySelector(".forgot").addEventListener("click", function(event) {
    event.preventDefault();

    if (email.value.trim() === "") {
        showMessage("Please enter your email first.", "red");
    }
    else if (!email.checkValidity()) {
        showMessage("Enter a valid email address.", "red");
    }
    else {
        showMessage("Password reset option selected.", "#0e6e66");
    }
});

// Sign up option
document.querySelector(".signup a").addEventListener("click", function(event) {
    event.preventDefault();
    showMessage("Sign Up page will be available soon.", "#0e6e66");
});

// Top login button
document.querySelector(".top-button").addEventListener("click", function() {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    email.focus();
});

// Show message when email changes
email.addEventListener("input", function() {
    if (email.value.trim() !== "") {
        message.textContent = "";
    }
});

// Show message when password changes
password.addEventListener("input", function() {
    if (password.value.trim() !== "") {
        message.textContent = "";
    }
});