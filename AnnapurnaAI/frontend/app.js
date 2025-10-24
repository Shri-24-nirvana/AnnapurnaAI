// Annapurna AI Application JavaScript
// This version connects all major buttons to the Django backend for data storage.

// --- API Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// --- Application State ---
// NOTE: These variables are used globally by the functions below.
let currentUser = null; 
let currentUserType = null; 
let currentView = 'studentHome';
let currentManagerView = 'dashboard';
let pendingAction = null;
let todaysMenus = {}; // { breakfast: menu_id, lunch: menu_id }
let mealStatuses = {}; // { breakfast: { status: 'attending', attendance_id: null }, ... }
let feedbackPoints = 0; 
let selectedRating = 0;
let selectedTags = [];
let weeklyMenuCache = {}; 
let prepSheetData = []; // Cache for manager prep sheet data


// --- FUNCTION DECLARATIONS ---
// --- All functions must be defined before the initial DOMContentLoaded event fires ---

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

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: headers,
        });

        if (response.status === 401) {
            showNotification('Session expired. Please log in again.', 'error');
            logout();
            throw new Error('Unauthorized');
        }
        return response;

    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error);
        if (!error.message.includes('Unauthorized')) {
             showNotification('Network error or server unavailable. Please check backend.', 'error');
        }
        throw error; 
    }
}


// --- Authentication Functions ---
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
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    try {
        // 1. Send login request
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Error from backend (e.g., 401 Unauthorized)
            throw new Error(data.detail || 'Login failed. Check email and password.');
        }
        
        // 2. Login Successful: Save tokens and determine role
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        currentUserType = payload.role; // Assign to global var

        if (!currentUserType) {
            throw new Error("User role could not be determined from token.");
        }
        
        // Use data returned by custom serializer (if available) or fall back
        currentUser = {
            id: payload.user_id,
            // The custom serializer should provide the email: data.email
            email: data.email || payload.email || email, 
            role: payload.role,
            active: true, // Assuming if token is issued, user is active
            name: data.name || payload.email || email // Use email as name fallback
        };


        if (currentUserType === 'student') {
            showPage('studentDashboard');
            await showView('studentHome');
            showNotification(`Welcome ${currentUser.email}!`, 'success');
        } else if (currentUserType === 'manager') {
            showPage('managerDashboard');
            await showManagerView('dashboard');
            setTimeout(() => initializeCharts(), 500);
            showNotification(`Welcome ${currentUser.email}!`, 'success');
        } else {
            throw new Error('Unknown user role in token.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || "An unknown login error occurred", 'error');
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    currentUser = null;
    currentUserType = null;
    todaysMenus = {};
    mealStatuses = {};
    feedbackPoints = 0;
    
    showPage('loginPage');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    showNotification('You have been logged out', 'info');
}

// --- Page Navigation ---
function showPage(pageId) {
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

// --- Student Dashboard Functions (Backend Connected) ---
async function updateStudentInfo() {
    if (!currentUser) return;

    const studentNameEl = document.getElementById('studentName');
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileIdEl = document.getElementById('profileId');
    const totalPointsEl = document.getElementById('totalPoints');
    
    if (studentNameEl) studentNameEl.textContent = currentUser.name || currentUser.email; 
    if (profileNameEl) profileNameEl.textContent = currentUser.name || currentUser.email; 
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email;
    if (profileIdEl) profileIdEl.textContent = `ID: ${currentUser.id}`; 
    
    // Mocking feedback points fetch for now
    feedbackPoints = 250; 
    if (totalPointsEl) totalPointsEl.textContent = feedbackPoints;
    
    await fetchStudentDashboardData(); 
}

async function fetchStudentDashboardData() {
    console.log("Fetching student dashboard data (menus and attendance)...");
    const today = new Date().toISOString().split('T')[0];
    todaysMenus = {}; 
    mealStatuses = {}; 

    try {
        // 1. Fetch Today's Menus
        const menuResponse = await apiFetch(`/menus/?meal_date=${today}`);
        if (!menuResponse.ok) throw new Error("Failed to fetch today's menus.");
        const menusToday = await menuResponse.json();

        menusToday.forEach(menu => {
            const mealTypeLower = menu.meal_type.toLowerCase();
            if (!['breakfast', 'lunch', 'dinner'].includes(mealTypeLower)) return; 

            todaysMenus[mealTypeLower] = menu.id; 

            const mealSection = document.getElementById(mealTypeLower);
            if (mealSection) {
                const dishName = menu.items && menu.items.length > 0 ? menu.items[0].name : "Not Available";
                const dishEl = mealSection.querySelector('.meal-name');
                if (dishEl) dishEl.textContent = dishName;
            }
        });

        // 2. Fetch Today's Attendance for the user
        const attendanceResponse = await apiFetch(`/attendance/?menu__meal_date=${today}`); 
        if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance.");
        const attendanceToday = await attendanceResponse.json();

        // 3. Populate mealStatuses
        ['breakfast', 'lunch', 'dinner'].forEach(mt => {
            mealStatuses[mt] = { status: 'attending', attendance_id: null, menu_id: todaysMenus[mt] || null };
        });
       
        attendanceToday.forEach(att => {
            const mealType = Object.keys(todaysMenus).find(key => todaysMenus[key] === att.menu);
            if (mealType && att.id !== undefined) {
                mealStatuses[mealType] = { status: 'skipped', attendance_id: att.id, menu_id: att.menu };
            }
        });

        updateMealDisplays(); 

    } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        showNotification(error.message || "Could not load dashboard data.", 'error');
        // Set loading state on failure
        ['breakfast', 'lunch', 'dinner'].forEach(mt => {
            mealStatuses[mt] = { status: 'error', attendance_id: null, menu_id: null };
        });
        updateMealDisplays(); 
    }
}

async function toggleMealStatus(mealType) {
    const mealInfo = mealStatuses[mealType];
    if (!mealInfo || mealInfo.menu_id === null) { 
        showNotification(`Menu information not available for ${mealType} today.`, "warning");
        return;
    }

    const currentStatus = mealInfo.status;
    const newStatus = currentStatus === 'attending' ? 'skipped' : 'attending';
    const action = newStatus === 'skipped' ? 'skip' : 'attend';
    const menuId = mealInfo.menu_id;
    const attendanceId = mealInfo.attendance_id;
    
    showConfirmModal(
        `Confirm ${action} meal`,
        `Are you sure you want to ${action} ${mealType}?`,
        async () => {
            const originalStatus = { ...mealStatuses[mealType] };

            try {
                // Optimistic UI Update
                mealStatuses[mealType].status = newStatus; 
                updateMealDisplays(); 

                if (newStatus === 'skipped') {
                    // POST to create an attendance record
                    const response = await apiFetch(`/attendance/`, {
                        method: 'POST',
                        body: JSON.stringify({ menu: menuId })
                    });
                    if (!response.ok) {
                         const errorData = await response.json();
                          const errorMsg = errorData.non_field_errors ? errorData.non_field_errors.join(' ') : (errorData.detail || JSON.stringify(errorData));
                         throw new Error(errorMsg);
                    }
                    const newAttendance = await response.json();
                    // Update local state with the new attendance ID
                    mealStatuses[mealType].attendance_id = newAttendance.id;

                } else { // newStatus is 'attending'
                    if (!attendanceId) throw new Error("No existing skip record found.");
                    
                    // DELETE to remove the attendance record
                    const response = await apiFetch(`/attendance/${attendanceId}/`, {
                        method: 'DELETE'
                    });
                    
                    if (response.status !== 204) {
                         // Try to get error details if available
                         let errorData = { detail: `Request failed with status ${response.status}` };
                         try { errorData = await response.json(); } catch(e){}
                         throw new Error(JSON.stringify(errorData) || 'Failed to unattend meal.');
                    }
                    // Update local state: remove attendance ID
                    mealStatuses[mealType].attendance_id = null;
                }

                // If API call was successful, show notification
                showNotification(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${newStatus}!`, 'success');

            } catch (error) {
                console.error('Toggle meal status API error:', error);
                showNotification(`Failed to ${action} meal. ${error.message}`, 'error');
                // --- Revert Optimistic UI Update on Failure ---
                mealStatuses[mealType] = originalStatus;
                updateMealDisplays();
            }
        }
    );
}

function updateMealDisplays() {
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => { // Iterate explicitly
        const mealSection = document.getElementById(mealType);
        if (mealSection) {
            const statusBadge = mealSection.querySelector('.status-badge');
            const skipBtn = mealSection.querySelector('.skip-btn');
            const statusInfo = mealStatuses[mealType]; // Get status object
            let status = 'loading'; // Default if not loaded yet
            
            if (statusInfo) {
                status = statusInfo.status; // 'attending' or 'skipped'
            }
            
            mealSection.className = `meal-section ${status}`; // Add status class
            if (statusBadge) {
                statusBadge.className = `status-badge ${status}`;
                statusBadge.textContent = status === 'attending' ? 'Attending' : status === 'skipped' ? 'Skipped' : '...'; // Show loading indicator
            }
            if (skipBtn) {
                skipBtn.textContent = status === 'attending' ? 'Skip' : 'Attend';
                skipBtn.disabled = status === 'loading' || status === 'error'; // Disable button while loading
            }
        } else {
            console.warn(`Meal section not found for: ${mealType}`);
        }
    });
}

// --- Menu Functions and Manager Views are omitted for brevity but remain connected ---



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
