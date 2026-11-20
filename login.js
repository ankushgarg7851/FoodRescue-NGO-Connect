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

// Login via Backend Express API with fallback
form.addEventListener("submit", async function (event) {
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

    showMessage("Authenticating with backend server...", "#146C65");

    try {
        // Authenticate with Express API
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword,
                role: selectedRole
            })
        });

        const data = await response.json();

        if (response.ok && data.user) {
            localStorage.setItem("loggedInUser", JSON.stringify({
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            }));

            showMessage("Login successful! Opening your dashboard...", "green");

            setTimeout(() => {
                if (data.user.role === "donor") {
                    window.location.href = "DONOR%20DASHBOARD.html";
                } else {
                    window.location.href = "NGO%20DASHBOARD.html";
                }
            }, 500);
            return;
        }

        // If backend returned error, check if credentials match local cache
        throw new Error(data.error || "Invalid credentials.");

    } catch (apiErr) {
        // Fallback to localStorage accounts
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users") || "[]");
        } catch {}

        const localUser = users.find(account =>
            account &&
            typeof account.email === "string" &&
            typeof account.password === "string" &&
            account.email.trim().toLowerCase() === userEmail &&
            account.password === userPassword &&
            account.role === selectedRole
        );

        if (localUser) {
            localStorage.setItem("loggedInUser", JSON.stringify({
                name: localUser.name,
                email: localUser.email,
                role: localUser.role
            }));

            showMessage("Login successful! Opening dashboard...", "green");

            setTimeout(() => {
                if (localUser.role === "donor") {
                    window.location.href = "DONOR%20DASHBOARD.html";
                } else {
                    window.location.href = "NGO%20DASHBOARD.html";
                }
            }, 500);
            return;
        }

        showMessage(
            apiErr.message || "Account not found. Check your details or sign up first.",
            "red"
        );
    }
});

// Forgot password
if (forgotLink) {
    forgotLink.addEventListener("click", function (event) {
        event.preventDefault();
        const userEmail = email.value.trim();

        if (!userEmail) {
            showMessage("Please enter your email address first.", "red");
            email.focus();
            return;
        }

        showMessage(
            "Password reset instructions have been recorded for " + userEmail + "."
        );
    });
}

// Clear messages on input
email.addEventListener("input", function () {
    message.textContent = "";
});

password.addEventListener("input", function () {
    message.textContent = "";
});
