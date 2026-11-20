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
if (togglePassword) {
    togglePassword.addEventListener("click", function() {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "Show";
        }
    });
}

// Signup form submission (Express Backend API + localStorage sync)
signupForm.addEventListener("submit", async function(event) {
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

    message.textContent = "Creating account on backend server...";
    message.style.color = "#146C65";

    const newUser = {
        name: name,
        email: email,
        password: password,
        role: selectedRole
    };

    try {
        // Send to Express Backend API
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || "Signup failed on server.";
            message.style.color = "red";
            return;
        }

        // Keep localStorage in sync for instant UI state
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users") || "[]");
            if (!Array.isArray(users)) users = [];
        } catch { users = []; }

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        localStorage.setItem("loggedInUser", JSON.stringify({
            name: name,
            email: email,
            role: selectedRole
        }));

        message.textContent = "Signup successful! Opening dashboard...";
        message.style.color = "green";

        const dashboardUrl = selectedRole === "donor"
            ? "DONOR%20DASHBOARD.html"
            : "NGO%20DASHBOARD.html";

        setTimeout(() => {
            window.location.assign(dashboardUrl);
        }, 600);

    } catch (error) {
        console.warn("Backend registration error, using offline fallback:", error);

        // Fallback local registration
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users") || "[]");
            if (!Array.isArray(users)) users = [];
        } catch { users = []; }

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("loggedInUser", JSON.stringify({
            name: name,
            email: email,
            role: selectedRole
        }));

        message.textContent = "Signup completed in offline mode. Opening dashboard...";
        message.style.color = "green";

        const dashboardUrl = selectedRole === "donor"
            ? "DONOR%20DASHBOARD.html"
            : "NGO%20DASHBOARD.html";

        setTimeout(() => {
            window.location.assign(dashboardUrl);
        }, 600);
    }
});
