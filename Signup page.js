
const signupForm = document.getElementById("signup-form");
const fullnameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const roleTabs = document.querySelectorAll(".role-tab");
const message = document.getElementById("message");
const togglePassword = document.getElementById("toggle-password");

let selectedRole = "donor";

// Read role from URL
const params = new URLSearchParams(window.location.search);
const requestedRole = params.get("role");

if (requestedRole === "ngo" || requestedRole === "donor") {
    selectedRole = requestedRole;
}

// Select role
function updateRoleButtons() {
    roleTabs.forEach(function(button) {
        button.classList.toggle(
            "active",
            button.dataset.role === selectedRole
        );
    });
}

roleTabs.forEach(function(button) {
    button.addEventListener("click", function() {
        selectedRole = button.dataset.role;
        updateRoleButtons();
        message.textContent = "";
    });
});

updateRoleButtons();

// Show or hide password
togglePassword.addEventListener("click", function() {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }
});

// Signup form submission
signupForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = fullnameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!name || !email || !password) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    if (!emailInput.checkValidity()) {
        message.textContent = "Enter a valid email address.";
        message.style.color = "red";
        return;
    }

    if (password.length < 6) {
        message.textContent = "Password must be at least 6 characters.";
        message.style.color = "red";
        return;
    }

    let users = [];

    try {
        users = JSON.parse(localStorage.getItem("users") || "[]");

        if (!Array.isArray(users)) {
            users = [];
        }
    } catch (error) {
        message.textContent = "Unable to read saved accounts.";
        message.style.color = "red";
        return;
    }

    const existingUser = users.find(function(user) {
        return user.email &&
            user.email.toLowerCase() === email &&
            user.role === selectedRole;
    });

    if (existingUser) {
        message.textContent =
            "Account already exists. Please use the login page.";
        message.style.color = "red";
        return;
    }

    const newUser = {
        name: name,
        email: email,
        password: password,
        role: selectedRole
    };

    try {
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        localStorage.setItem("loggedInUser", JSON.stringify({
            name: name,
            email: email,
            role: selectedRole
        }));
    } catch (error) {
        message.textContent = "Unable to save account in this browser.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Signup successful! Opening dashboard...";
    message.style.color = "green";

    // Open the correct dashboard
    const dashboardUrl = selectedRole === "donor"
        ? "DONOR%20DASHBOARD.html"
        : "NGO%20DASHBOARD.html";

    window.location.assign(dashboardUrl);
});
