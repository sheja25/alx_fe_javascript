let quotes = [];
let categories = new Set();
const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL = 60000; // Sync every minute

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
        updateCategories();
    }
}

function updateCategories() {
    categories = new Set(quotes.map(quote => quote.category));
    populateCategoryFilter();
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category; // This ensures the category is visible
        categoryFilter.appendChild(option);
    });
}

function showRandomQuote(filteredQuotes = quotes) {
    if (filteredQuotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available for this category.</p>';
        return;
    }

    const quoteDisplay = document.getElementById('quoteDisplay');
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    
    quoteDisplay.innerHTML = '';
    
    const quoteText = document.createElement('p');
    quoteText.textContent = quote.text;
    
    const quoteCategory = document.createElement('small');
    quoteCategory.textContent = `Category: ${quote.category}`;
    
    quoteDisplay.appendChild(quoteText);
    quoteDisplay.appendChild(quoteCategory);

    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';
    formContainer.innerHTML = `
        <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
        <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
        <button onclick="addQuote()">Add Quote</button>
    `;
    document.body.appendChild(formContainer);
}

function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteCategory) {
        quotes.push({ text: newQuoteText, category: newQuoteCategory });
        saveQuotes();
        updateCategories();
        alert('New quote added successfully!');
        
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        filterQuotes();
    } else {
        alert('Please enter both the quote and its category.');
    }
}

function filterQuotes() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    localStorage.setItem('lastSelectedCategory', selectedCategory);
    
    if (selectedCategory === 'all') {
        showRandomQuote();
    } else {
        const filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        showRandomQuote(filteredQuotes);
    }
}

function exportQuotes() {
    const jsonString = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                updateCategories();
                alert('Quotes imported successfully!');
                filterQuotes();
            } else {
                throw new Error('Invalid JSON format');
            }
        } catch (error) {
            alert('Error importing quotes: ' + error.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// Simulate fetching quotes from server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.slice(0, 10).map(post => ({
            text: post.body.split('\n')[0],
            category: post.title.split(' ')[0]
        }));
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }
}

// Simulate posting a quote to server
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: quote.category,
                body: quote.text,
                userId: 1,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error posting quote:', error);
        return null;
    }
}

// Sync quotes with server
async function syncQuotes() {
    const serverQuotes = await fetchQuotesFromServer();
    const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
    
    // Merge server and local quotes, giving precedence to server data
    const mergedQuotes = [...serverQuotes];
    localQuotes.forEach(localQuote => {
        if (!mergedQuotes.some(q => q.text === localQuote.text)) {
            mergedQuotes.push(localQuote);
        }
    });

    quotes = mergedQuotes;
    saveQuotes();
    updateCategories();
    showNotification('Quotes synced with server');
}

// Add a new quote (local and server)
async function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteCategory) {
        const newQuote = { text: newQuoteText, category: newQuoteCategory };
        quotes.push(newQuote);
        saveQuotes();
        updateCategories();
        
        // Attempt to post to server
        const serverResponse = await postQuoteToServer(newQuote);
        if (serverResponse) {
            showNotification('Quote added and synced with server');
        } else {
            showNotification('Quote added locally. Failed to sync with server.', 'warning');
        }
        
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        filterQuotes();
    } else {
        showNotification('Please enter both the quote and its category.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Start periodic sync
function startPeriodicSync() {
    syncQuotes(); // Initial sync
    setInterval(syncQuotes, SYNC_INTERVAL);
}

// ... (keep other existing functions)

document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    createAddQuoteForm();
    // ... (keep other existing code)
    
    startPeriodicSync();
});

document.getElementById('newQuote').addEventListener('click', () => filterQuotes());

document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    createAddQuoteForm();

    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Quotes';
    exportButton.onclick = exportQuotes;
    document.body.appendChild(exportButton);

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'importFile';
    importInput.accept = '.json';
    importInput.onchange = importFromJsonFile;
    document.body.appendChild(importInput);

    const lastSelectedCategory = localStorage.getItem('lastSelectedCategory');
    if (lastSelectedCategory) {
        document.getElementById('categoryFilter').value = lastSelectedCategory;
    }
    filterQuotes();
});