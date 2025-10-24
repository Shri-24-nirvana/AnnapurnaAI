// Annapurna AI Application JavaScript
// This version is connected to the Django backend.

// --- API Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// --- Make functions available globally immediately ---
window.login = login;
window.logout = logout;
window.togglePassword = togglePassword;
window.showView = showView;
window.toggleMealStatus = toggleMealStatus;
window.showDayMenu = showDayMenu;
window.showMonthlyPlan = showMonthlyPlan;
window.downloadMealPlan = downloadMealPlan;
window.toggleTag = toggleTag;
window.submitFeedback = submitFeedback;
window.redeemReward = redeemReward;
window.editProfile = editProfile;
window.showStudentProfile = showStudentProfile;
window.showNotifications = showNotifications;
window.showManagerView = showManagerView;
window.showManagerProfile = showManagerProfile;
window.printPrepSheet = printPrepSheet;
window.exportCSV = exportCSV;
window.addInventoryItem = addInventoryItem;
window.editInventoryItem = editInventoryItem;
window.showInventoryTab = showInventoryTab;
window.approveMenu = approveMenu;
window.showAnalyticsTab = showAnalyticsTab;
window.closeModal = closeModal;
window.confirmAction = confirmAction;

// --- Application State ---
let currentUser = null;
let currentUserType = null;
let currentView = 'studentHome';
let currentManagerView = 'dashboard';
let pendingAction = null;
let mealStatuses = {
    breakfast: 'attending',
    lunch: 'attending',
    dinner: 'skipped'
};
let feedbackPoints = 250;
let selectedRating = 0;
let selectedTags = [];

// --- MOCK DATA (for Student Demo) ---
// We keep this so the student-facing parts of the demo
// are fast and don't require a full database setup.
const appData = {
    students: [
        {
            id: "ST001",
            name: "Priya Sharma", 
            email: "student@example.com", // Use this to log in
            feedbackPoints: 250,
            mealStreak: 8,
            todaysMeals: {
                breakfast: {dish: "Poha with Tea", status: "attending"},
                lunch: {dish: "Paneer Butter Masala", status: "attending"},
                dinner: {dish: "Dal Makhani with Rice", status: "skipped"}
            }
        }
    ],
    managers: [
        {
            id: "MG001",
            name: "Rajesh Kumar",
            email: "manager@example.com" // Use this to log in
        }
    ],
    weeklyMenu: [
        {
            day: "Monday",
            meals: {
                breakfast: "Poha with Tea",
                lunch: "Paneer Butter Masala with Rice",
                dinner: "Dal Makhani with Roti"
            }
        },
        {
            day: "Tuesday", 
            meals: {
                breakfast: "Upma with Coffee",
                lunch: "Chicken Curry with Rice",
                dinner: "Rajma with Rice"
            }
        }
    ],
    // liveMetrics, inventory, and rewards are also kept for the mock-up
    liveMetrics: { ... }, 
    inventory: [ ... ],
    rewards: [ ... ]
};


// --- API Helper Function ---
/**
 * A helper function to make authenticated API requests.
 * It automatically adds the JWT token to the header.
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: headers,
    });

    if (response.status === 401) {
        // Token is invalid or expired
        showNotification('Session expired. Please log in again.', 'error');
        logout();
        throw new Error('Unauthorized');
    }
    return response;
}


// --- Authentication Functions (Backend Connected) ---
function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleBtn = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

async function login(userType) {
    console.log('Login function called with userType:', userType);
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Email:', email, 'Password:', password);
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    // --- REAL API CALL ---
    try {
        // 1. Send login request to Django backend
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed. Check email and password.');
        }
        
        // 2. Login Successful: Save tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        currentUserType = userType; // Trust the button click for the demo

        if (userType === 'student') {
            // --- Use Mock Data for Student Demo ---
            currentUser = appData.students[0]; 
            console.log('Logging in as student (using mock data)');
            showPage('studentDashboard');
            showView('studentHome');
            updateStudentInfo(); // This will use the mock data
            showNotification(`Welcome ${currentUser.name}!`, 'success');

        } else {
            // --- Use Real Data for Manager Demo ---
            currentUser = appData.managers[0]; // Use mock name for welcome
            console.log('Logging in as manager (connecting to backend)');
            showPage('managerDashboard');
            // This will fetch REAL data from the backend
            await showManagerView('dashboard'); 
            setTimeout(() => initializeCharts(), 500); // Give charts time to render
            showNotification(`Welcome ${currentUser.name}!`, 'success');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, 'error');
    }
}

function logout() {
    // Clear tokens from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Reset state
    currentUser = null;
    currentUserType = null;
    showPage('loginPage');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    showNotification('You have been logged out', 'info');
}

// --- Page Navigation ---
function showPage(pageId) {
    console.log('Showing page:', pageId);
    document.querySelectorAll('.login-container, .dashboard').forEach(page => {
        page.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('Page not found:', pageId);
    }
}

// --- Student Dashboard Functions (Mock) ---
// We keep these as-is for a smooth student demo
function updateStudentInfo() {
    const studentNameEl = document.getElementById('studentName');
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileIdEl = document.getElementById('profileId');
    const totalPointsEl = document.getElementById('totalPoints');
    
    if (studentNameEl) studentNameEl.textContent = currentUser.name;
    if (profileNameEl) profileNameEl.textContent = currentUser.name;
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email;
    if (profileIdEl) profileIdEl.textContent = currentUser.id;
    if (totalPointsEl) totalPointsEl.textContent = feedbackPoints;
    
    updateMealDisplays();
}

function showView(viewId) {
    console.log('Showing view:', viewId);
    
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(viewId)) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('#studentDashboard .view').forEach(view => {
        view.classList.remove('active');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    currentView = viewId;
    
    if (viewId === 'monthlyPlan') {
        generateMonthlyCalendar();
    }
}

function toggleMealStatus(mealType) {
    // This remains a mock function for the demo
    // A real implementation would require fetching menu IDs
    // and posting to the /attendance/ endpoint.
    const currentStatus = mealStatuses[mealType];
    const newStatus = currentStatus === 'attending' ? 'skipped' : 'attending';
    const action = newStatus === 'skipped' ? 'skip' : 'attend';
    
    showConfirmModal(
        `Confirm ${action} meal`,
        `Are you sure you want to ${action} ${mealType}?`,
        () => {
            mealStatuses[mealType] = newStatus;
            updateMealDisplays();
            showNotification(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${newStatus === 'skipped' ? 'skipped' : 'marked for attendance'}`, 'success');
        }
    );
}

function updateMealDisplays() {
    Object.keys(mealStatuses).forEach(mealType => {
        const mealSection = document.getElementById(mealType);
        if (mealSection) {
            const statusBadge = mealSection.querySelector('.status-badge');
            const skipBtn = mealSection.querySelector('.skip-btn');
            const status = mealStatuses[mealType];
            
            mealSection.className = `meal-section ${status}`;
            if (statusBadge) {
                statusBadge.className = `status-badge ${status}`;
                statusBadge.textContent = status === 'attending' ? 'Attending' : 'Skipped';
            }
            if (skipBtn) {
                skipBtn.textContent = status === 'attending' ? 'Skip' : 'Attend';
            }
        }
    });
}

function showDayMenu(day) {
    document.querySelectorAll('.day-card').forEach(card => {
        card.classList.remove('active');
    });
    // Add check for event.target
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const dayMenu = document.getElementById('dayMenu');
    const menuData = appData.weeklyMenu.find(d => d.day.toLowerCase() === day);
    
    if (dayMenu && menuData) {
        dayMenu.innerHTML = `
            <div class="menu-item">
                <span>Breakfast: ${menuData.meals.breakfast}</span>
            </div>
            <div class="menu-item">
                <span>Lunch: ${menuData.meals.lunch}</span>
                <span class="ai-badge" title="This dish was chosen based on an average 4.5-star rating from students!">AI Choice</span>
            </div>
            <div class="menu-item">
                <span>Dinner: ${menuData.meals.dinner}</span>
            </div>
        `;
    }
}

function showMonthlyPlan() {
    showView('monthlyPlan');
}

function generateMonthlyCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-header';
        dayHeader.textContent = day;
        dayHeader.style.cssText = 'padding: 8px; font-weight: 500; text-align: center; background: var(--color-bg-1);';
        calendarGrid.appendChild(dayHeader);
    });
    
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-cell';
        dayCell.style.cssText = 'padding: 12px; border: 1px solid var(--color-border); text-align: center; cursor: pointer; transition: background var(--duration-fast);';
        
        if (day === today.getDate()) {
            dayCell.style.background = 'var(--color-primary)';
            dayCell.style.color = 'var(--color-btn-primary-text)';
        }
        
        dayCell.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px;">${day}</div>
            <div style="font-size: 10px; color: var(--color-text-secondary);">
                ${day % 2 === 0 ? 'Veg' : 'Non-Veg'}
            </div>
        `;
        
        dayCell.addEventListener('mouseover', function() {
            if (day !== today.getDate()) {
                this.style.background = 'var(--color-bg-2)';
            }
        });
        dayCell.addEventListener('mouseout', function() {
            if (day !== today.getDate()) {
                this.style.background = 'transparent';
            }
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

function downloadMealPlan() {
    showNotification('Monthly meal plan downloaded!', 'success');
}

// --- Feedback System (Mock) ---
function setStarRating(rating) {
    selectedRating = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function toggleTag(tagElement) {
    tagElement.classList.toggle('selected');
    const tagText = tagElement.textContent;
    
    if (tagElement.classList.contains('selected')) {
        if (!selectedTags.includes(tagText)) {
            selectedTags.push(tagText);
        }
    } else {
        selectedTags = selectedTags.filter(tag => tag !== tagText);
    }
}

function submitFeedback(buttonElement) {
    // A real version would POST this to /api/v1/feedback/
    if (selectedRating === 0) {
        showNotification('Please select a rating', 'warning');
        return;
    }
    
    const feedbackItem = buttonElement.closest('.feedback-item');
    const comment = feedbackItem.querySelector('textarea').value;
    
    const pointsEarned = selectedRating * 4; 
    feedbackPoints += pointsEarned;
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = feedbackPoints;
    
    selectedRating = 0;
    selectedTags = [];
    highlightStars(0);
    feedbackItem.querySelector('textarea').value = '';
    feedbackItem.querySelectorAll('.tag.selected').forEach(tag => {
        tag.classList.remove('selected');
    });
    
    feedbackItem.style.opacity = '0.6';
    buttonElement.textContent = 'Submitted';
    buttonElement.disabled = true;
    
    showNotification(`Feedback submitted! You earned ${pointsEarned} points.`, 'success');
}

// --- Rewards System (Mock) ---
function redeemReward(rewardType, cost) {
    if (feedbackPoints < cost) {
        showNotification('Insufficient points for this reward', 'warning');
        return;
    }
    
    showConfirmModal(
        'Redeem Reward',
        `Redeem this reward for ${cost} points?`,
        () => {
            feedbackPoints -= cost;
            const totalPointsEl = document.getElementById('totalPoints');
            if (totalPointsEl) totalPointsEl.textContent = feedbackPoints;
            showNotification('Reward redeemed successfully!', 'success');
        }
    );
}

// --- Profile Management (Mock) ---
function editProfile() {
    showNotification('Profile editing feature coming soon!', 'info');
}

function showStudentProfile() {
    showView('studentProfile');
}

function showNotifications() {
    showModal('notificationModal');
}

// --- Manager Dashboard Functions (Backend Connected) ---

async function showManagerView(viewId) {
    console.log('Showing manager view:', viewId);
    
    // Update sidebar navigation
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(viewId)) {
            item.classList.add('active');
        }
    });
    
    // Show the requested view
    document.querySelectorAll('#managerDashboard .view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetViewId = viewId === 'dashboard' ? 'managerDashboardView' : `${viewId}View`;
    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    currentManagerView = viewId;
    
    // --- THIS IS THE NEW API-CONNECTED PART ---
    // Fetch real data when the view is shown
    if (viewId === 'dashboard') {
        await updateManagerDashboard();
        initializeCharts(); // Re-initialize charts with potentially new data
    }
    // else if (viewId === 'inventory') {
    //    await fetchInventoryData(); // You can build this next
    // }
}

async function updateManagerDashboard() {
    console.log("Fetching real data for manager dashboard...");
    try {
        // Use our helper function to make an authenticated call
        const response = await apiFetch('/dashboard/summary/');
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.msg || 'Failed to fetch dashboard data');
        }

        const data = await response.json();
        console.log("Backend data received:", data);

        // Update live metrics with REAL data
        const headcountEl = document.querySelector('.headcount-number');
        const headcountTotalEl = document.querySelector('.headcount-total');
        
        if (headcountEl) headcountEl.textContent = data.live_data.live_headcount;
        if (headcountTotalEl) headcountTotalEl.textContent = `out of ${data.live_data.total_students}`;
        
        // Update progress bar
        const percentage = (data.live_data.live_headcount / data.live_data.total_students) * 100;
        const progressEl = document.querySelector('.headcount-display + .progress-bar .progress');
        if (progressEl) progressEl.style.width = `${percentage}%`;
        
        // Update savings and waste reduction
        const metricValues = document.querySelectorAll('.metric-value');
        // This value comes directly from our backend calculation
        if (metricValues[0]) metricValues[0].textContent = `₹${data.financials.projected_savings_today}`;
        // This is still a placeholder, as our backend doesn't calculate it yet
        if (metricValues[1]) metricValues[1].textContent = "18%"; // TODO: Add to API

        // Update Prep Sheet with REAL AI predictions
        const prepSheetBody = document.getElementById('prepSheetBody');
        if (prepSheetBody) {
            prepSheetBody.innerHTML = ''; // Clear mock data
            if (data.ai_predictions.prep_sheet.length > 0) {
                data.ai_predictions.prep_sheet.forEach(item => {
                    prepSheetBody.innerHTML += `
                        <tr>
                            <td>${item.item}</td>
                            <td>${item.quantity_kg.toFixed(2)} kg</td>
                            <td>${item.item === 'Rice' ? 'Basmati Rice' : 'Paneer, Tomato, etc.'}</td>
                        </tr>
                    `;
                });
            } else {
                prepSheetBody.innerHTML = `<tr><td colspan="3">No prep sheet available.</td></tr>`;
            }
        }
        
    } catch (error) {
        console.error("Failed to update manager dashboard:", error);
        showNotification(error.message, 'error');
    }
}


function showManagerProfile() {
    showNotification('Manager profile feature coming soon!', 'info');
}

// --- Prep Sheet Functions (Mock) ---
function printPrepSheet() {
    window.print();
    showNotification('Prep sheet sent to printer', 'success');
}

function exportCSV() {
    // This can now be improved to use REAL data
    const prepSheetBody = document.getElementById('prepSheetBody');
    if (!prepSheetBody) return;
    
    let csvContent = "Menu Item,Recommended Quantity,Raw Materials\n";
    prepSheetBody.querySelectorAll('tr').forEach(tr => {
        const cols = tr.querySelectorAll('td');
        if(cols.length === 3) {
            csvContent += `"${cols[0].textContent}","${cols[1].textContent}","${cols[2].textContent}"\n`;
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prep_sheet.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Prep sheet exported as CSV', 'success');
}

// --- Inventory Management (Mock) ---
function addInventoryItem() {
    showNotification('Add inventory item feature coming soon!', 'info');
}

function editInventoryItem(itemId) {
    showNotification(`Edit ${itemId} feature coming soon!`, 'info');
}

function showInventoryTab(tabId) {
    document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    if (tabId === 'orders') {
        showNotification('AI Purchase Orders view coming soon!', 'info');
    }
}

// --- Menu Designer (Mock) ---
function approveMenu() {
    showConfirmModal(
        'Approve Weekly Menu',
        'Are you sure you want to approve this weekly menu?',
        () => {
            showNotification('Weekly menu approved successfully!', 'success');
        }
    );
}

function showAnalyticsTab(tabId) {
    document.querySelectorAll('.analytics-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    updateAnalyticsChart(tabId);
}

function updateAnalyticsChart(tabId) {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;

    if (window.analyticsChart) {
        window.analyticsChart.destroy();
    }

    let chartData, chartOptions;

    switch (tabId) {
        case 'feedback':
            chartData = {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Average Rating',
                    data: [4.2, 4.5, 4.1, 4.3, 4.6, 4.4, 4.2],
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    tension: 0.4
                }]
            };
            break;
        case 'waste':
            chartData = {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Waste Percentage',
                    data: [25, 20, 18, 15],
                    backgroundColor: '#FFC185',
                    borderColor: '#FFC185'
                }]
            };
            break;
        case 'consumption':
            chartData = {
                labels: ['Breakfast', 'Lunch', 'Dinner'],
                datasets: [{
                    label: 'Consumption Rate',
                    data: [85, 92, 78],
                    backgroundColor: ['#B4413C', '#ECEBD5', '#5D878F']
                }]
            };
            break;
        default:
            chartData = { labels: [], datasets: [] };
    }

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    window.analyticsChart = new Chart(ctx, {
        type: tabId === 'consumption' ? 'doughnut' : 'line',
        data: chartData,
        options: chartOptions
    });
}

// --- Chart Initialization (Mock) ---
function initializeCharts() {
    console.log('Initializing charts...');

    // Headcount Chart
    setTimeout(() => {
        const headcountCtx = document.getElementById('headcountChart');
        if (headcountCtx) {
            // Destroy existing chart if it exists
            if (window.headcountChart) {
                window.headcountChart.destroy();
            }
            window.headcountChart = new Chart(headcountCtx, {
                type: 'line',
                data: {
                    labels: ['Sep 4', 'Sep 5', 'Sep 6', 'Sep 7', 'Sep 8', 'Sep 9', 'Sep 10'],
                    datasets: [
                        {
                            label: 'Actual Headcount',
                            data: [1820, 1850, 1780, 1890, 1820, 1870, 1854],
                            backgroundColor: '#1FB8CD',
                            borderColor: '#1FB8CD',
                            tension: 0.4
                        },
                        {
                            label: 'AI Forecast',
                            data: [1800, 1840, 1790, 1880, 1810, 1860, 1850],
                            backgroundColor: '#FFC185',
                            borderColor: '#FFC185',
                            tension: 0.4,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 1700
                        }
                    }
                }
            });
        }

        // Rating Trends Chart
        const ratingTrendsCtx = document.getElementById('ratingTrendsChart');
        if (ratingTrendsCtx) {
            if (window.ratingTrendsChart) {
                window.ratingTrendsChart.destroy();
            }
            window.ratingTrendsChart = new Chart(ratingTrendsCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Average Rating',
                        data: [4.1, 4.3, 4.2, 4.5],
                        backgroundColor: '#B4413C',
                        borderColor: '#B4413C',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 3.5,
                            max: 5
                        }
                    }
                }
            });
        }

        // Initialize analytics chart
        updateAnalyticsChart('feedback');
    }, 100);
}

// --- Modal Functions (Mock) ---
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    pendingAction = null;
}

function showConfirmModal(title, message, confirmAction) {
    const titleEl = document.getElementById('modalTitle');
    const messageEl = document.getElementById('modalMessage');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    pendingAction = confirmAction;
    showModal('confirmModal');
}

function confirmAction() {
    if (pendingAction) {
        pendingAction();
        pendingAction = null;
    }
    closeModal();
}

// --- Notification System (Mock) ---
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]: ${message}`);

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-surface);
        color: var(--color-text);
        padding: 16px 20px;
        border-radius: 8px;
        border-left: 4px solid var(--color-${type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'});
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// --- DOM Ready Event & Listeners (Mock) ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    showPage('loginPage');
    setupEventListeners();
});

function setupEventListeners() {
    // Star rating listeners
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setStarRating(rating);
        });

        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });

    // Reset star highlighting on mouse leave
    document.querySelectorAll('.star-rating').forEach(container => {
        container.addEventListener('mouseleave', function() {
            highlightStars(selectedRating);
        });
    });

    // Handle form submission with Enter key
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Default student for demo
            login('student');
        });
    }
}

// Handle clicks outside modals to close them
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Simulate real-time updates for manager dashboard
setInterval(() => {
    // This interval is now less important because we fetch real data
    // but we can leave it to simulate live updates
    if (currentUserType === 'manager' && currentManagerView === 'dashboard') {
        const headcountEl = document.querySelector('.headcount-number');
        if (headcountEl) {
            const currentHeadcount = parseInt(headcountEl.textContent);
            if (isNaN(currentHeadcount)) return; // Don't run if data isn't loaded
            const newHeadcount = currentHeadcount + Math.floor(Math.random() * 5) - 2;
            const totalText = document.querySelector('.headcount-total') ? document.querySelector('.headcount-total').textContent : '';
            const totalStudents = parseInt(totalText.split(' ')[2]) || 0;
            const clampedHeadcount = Math.max(0, Math.min(totalStudents || newHeadcount, newHeadcount));

            headcountEl.textContent = clampedHeadcount;
            const percentage = totalStudents ? (clampedHeadcount / totalStudents) * 100 : 0;
            const progressEl = document.querySelector('.headcount-display + .progress-bar .progress');
            if (progressEl) {
                progressEl.style.width = `${percentage}%`;
            }
        }
    }
}, 30000); // Update every 30 seconds
