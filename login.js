
const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const roleButtons = document.querySelectorAll(".role-button");
const message = document.getElementById("message");
const signupLink = document.getElementById("signup-link");
const forgotLink = document.querySelector(".forgot");

let selectedRole = "donor";

// Show message
function showMessage(text, color = "#0e6e66") {
    message.textContent = text;
    message.style.color = color;
}

// Select Donor or NGO
roleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedRole = button.dataset.role;

        roleButtons.forEach(function (item) {
            item.classList.toggle("active", item === button);
        });

        signupLink.href = selectedRole === "ngo"
            ? "signup%20page.html?role=ngo"
            : "signup%20page.html?role=donor";

        email.placeholder = selectedRole === "ngo"
            ? "Enter your NGO email"
            : "e.g., restaurant@gmail.com";

        showMessage(
            selectedRole === "ngo"
                ? "NGO Login selected"
                : "Food Donor Login selected"
        );
    });
});

// Login using signup account details
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const userEmail = email.value.trim().toLowerCase();
    const userPassword = password.value;

    if (!userEmail || !userPassword) {
        showMessage("Please fill in all fields.", "red");
        return;
    }

    if (!email.checkValidity()) {
        showMessage("Please enter a valid email address.", "red");
        return;
    }

    // Get accounts created on signup page
    let users;

    try {
        users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch (error) {
        showMessage("Could not read saved accounts.", "red");
        return;
    }

    if (!Array.isArray(users)) {
        showMessage("Saved account data is invalid.", "red");
        return;
    }

    // Match email, password and role
    const user = users.find(function (account) {
        return (
            account &&
            typeof account.email === "string" &&
            typeof account.password === "string" &&
            account.email.trim().toLowerCase() === userEmail &&
            account.password === userPassword &&
            account.role === selectedRole
        );
    });

    // If account does not exist
    if (!user) {
        showMessage(
            "Account not found. Check your details and selected role, or sign up first.",
            "red"
        );
        return;
    }

    // Save logged-in user information
    localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role
        })
    );

    showMessage("Login successful! Opening your dashboard...", "green");

    // Redirect to the correct dashboard
    if (user.role === "donor") {
        window.location.href = "DONOR%20DASHBOARD.html";
    } else if (user.role === "ngo") {
        window.location.href = "NGO%20DASHBOARD.html";
    }
});

// Forgot password
forgotLink.addEventListener("click", function (event) {
    event.preventDefault();

    if (!email.value.trim()) {
        showMessage("Please enter your email address first.", "red");
        email.focus();
        return;
    }

    if (!email.checkValidity()) {
        showMessage("Please enter a valid email address.", "red");
        return;
    }

    showMessage(
        "Password reset is not connected yet. Please contact your project administrator."
    );
});

// Clear messages when user edits fields
email.addEventListener("input", function () {
    message.textContent = "";
});

password.addEventListener("input", function () {
    message.textContent = "";
});
