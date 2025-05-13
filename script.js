var typed = new Typed(".text", {
    strings:[" AI Recipe Manager"] ,
    typeSpeed:100,
    backSpeed:100,
    backDelay:500,
    loop:true

});



document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const recipeForm = document.getElementById('recipe-form');
    const recipeModal = document.getElementById('recipe-modal');
    const aiModal = document.getElementById('ai-modal');
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const generateRecipeBtn = document.getElementById('generate-recipe-btn');
    const analyzeNutritionBtn = document.getElementById('analyze-nutrition-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const recipeList = document.querySelector('.recipe-list');
    const emptyState = document.getElementById('empty-state');
    const closeBtns = document.querySelectorAll('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const aiCancelBtn = document.getElementById('ai-cancel-btn');
    const tagButtons = document.querySelectorAll('.tag-btn');
    
    // State
    let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    let currentRecipeId = null;
    let currentFilter = 'all';
    let currentSearch = '';
    
    // Initialize the app
    init();
    
    function init() {
        renderRecipes();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Recipe Form
        recipeForm.addEventListener('submit', handleRecipeSubmit);
        
        // Modal Buttons
        addRecipeBtn.addEventListener('click', () => openRecipeModal());
        closeBtns.forEach(btn => btn.addEventListener('click', closeModals));
        cancelBtn.addEventListener('click', closeModals);
        aiCancelBtn.addEventListener('click', closeModals);
        
        // AI Buttons
        generateRecipeBtn.addEventListener('click', generateRecipeWithAI);
        analyzeNutritionBtn.addEventListener('click', analyzeNutritionWithAI);
        
        // Search
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Filter Tags
        tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tagButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.tag;
                renderRecipes();
            });
        });
    }
    
    // Recipe CRUD Operations
    function openRecipeModal(recipe = null) {
        currentRecipeId = recipe ? recipe.id : null;
        document.getElementById('modal-title').textContent = recipe ? 'Edit Recipe' : 'Add New Recipe';
        
        if (recipe) {
            document.getElementById('recipe-name').value = recipe.name;
            document.getElementById('recipe-ingredients').value = recipe.ingredients.join('\n');
            document.getElementById('recipe-instructions').value = recipe.instructions;
            document.getElementById('recipe-cuisine').value = recipe.cuisine || '';
            document.getElementById('recipe-time').value = recipe.time || '';
            
            // Clear all checkboxes first
            document.querySelectorAll('input[name="tags"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Set the checkboxes based on recipe tags
            if (recipe.tags) {
                recipe.tags.forEach(tag => {
                    const checkbox = document.querySelector(`input[name="tags"][value="${tag}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        } else {
            recipeForm.reset();
        }
        
        recipeModal.style.display = 'block';
    }
    
    function handleRecipeSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('recipe-name').value;
        const ingredients = document.getElementById('recipe-ingredients').value.split('\n').filter(i => i.trim());
        const instructions = document.getElementById('recipe-instructions').value;
        const cuisine = document.getElementById('recipe-cuisine').value;
        const time = document.getElementById('recipe-time').value;
        
        const tags = [];
        document.querySelectorAll('input[name="tags"]:checked').forEach(checkbox => {
            tags.push(checkbox.value);
        });
        
        const recipe = {
            id: currentRecipeId || Date.now().toString(),
            name,
            ingredients,
            instructions,
            cuisine,
            time,
            tags,
            createdAt: currentRecipeId ? recipes.find(r => r.id === currentRecipeId).createdAt : new Date().toISOString()
        };
        
        if (currentRecipeId) {
            // Update existing recipe
            recipes = recipes.map(r => r.id === currentRecipeId ? recipe : r);
        } else {
            // Add new recipe
            recipes.push(recipe);
        }
        
        saveRecipes();
        renderRecipes();
        closeModals();
    }
    
    function deleteRecipe(id) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            recipes = recipes.filter(recipe => recipe.id !== id);
            saveRecipes();
            renderRecipes();
        }
    }
    
    function saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(recipes));
    }
    
    // Rendering
    function renderRecipes() {
        // Filter recipes based on current filter and search
        let filteredRecipes = [...recipes];
        
        // Apply tag filter
        if (currentFilter !== 'all') {
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.tags && recipe.tags.includes(currentFilter)
            );
        }
        
        // Apply search filter
        if (currentSearch) {
            const searchTerm = currentSearch.toLowerCase();
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.name.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm)) ||
                (recipe.cuisine && recipe.cuisine.toLowerCase().includes(searchTerm))
            );
        }
        
        // Clear the recipe list
        recipeList.innerHTML = '';
        
        // Show empty state if no recipes
        if (filteredRecipes.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Render each recipe
        filteredRecipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            // Create random placeholder image based on recipe name for variety
            const imageNum = (recipe.name.charCodeAt(0) % 5) + 1;
            
            recipeCard.innerHTML = `
                <div class="recipe-image" style="background-image: url('https://source.unsplash.com/random/300x200/?food,${imageNum}')">
                    <div class="recipe-tags">
                        ${recipe.tags && recipe.tags.includes('favorite') ? 
                            '<span class="recipe-tag"><i class="fas fa-star"></i></span>' : ''}
                        ${recipe.tags && recipe.tags.includes('to-try') ? 
                            '<span class="recipe-tag"><i class="fas fa-list"></i></span>' : ''}
                        ${recipe.tags && recipe.tags.includes('made-before') ? 
                            '<span class="recipe-tag"><i class="fas fa-check"></i></span>' : ''}
                    </div>
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <div class="recipe-meta">
                        ${recipe.cuisine ? `<span><i class="fas fa-globe"></i> ${recipe.cuisine}</span>` : ''}
                        ${recipe.time ? `<span><i class="fas fa-clock"></i> ${recipe.time} mins</span>` : ''}
                    </div>
                    <div class="recipe-ingredients">
                        ${recipe.ingredients.slice(0, 3).map(i => `• ${i}`).join('<br>')}
                        ${recipe.ingredients.length > 3 ? '<br>...' : ''}
                    </div>
                    <div class="recipe-actions">
                        <button class="edit-btn" data-id="${recipe.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn" data-id="${recipe.id}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            `;
            
            recipeList.appendChild(recipeCard);
        });
        
        // Add event listeners to the new buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const recipe = recipes.find(r => r.id === btn.dataset.id);
                openRecipeModal(recipe);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteRecipe(btn.dataset.id);
            });
        });
    }
    
    // Search and Filter
    function handleSearch() {
        currentSearch = searchInput.value.trim();
        renderRecipes();
    }
    
    // Modal Management
    function closeModals() {
        recipeModal.style.display = 'none';
        aiModal.style.display = 'none';
    }
    
    // AI Functions
    async function generateRecipeWithAI() {
        openAiModal('AI Recipe Generator');
        
        // Show loading state
        document.getElementById('ai-modal-body').innerHTML = `
            <div class="ai-loading">
                <i class="fas fa-spinner"></i>
                <p>Generating recipe ideas...</p>
            </div>
        `;
        
        try {
            // Simulate AI API call (in a real app, you would call an actual AI API)
            const response = await simulateAIRequest('recipe-generation');
            
            document.getElementById('ai-modal-body').innerHTML = `
                <div class="ai-response">
                    <h3>Generated Recipe Idea</h3>
                    <p><strong>Name:</strong> ${response.name}</p>
                    <p><strong>Cuisine:</strong> ${response.cuisine}</p>
                    <p><strong>Preparation Time:</strong> ${response.time} minutes</p>
                    <p><strong>Ingredients:</strong></p>
                    <ul>
                        ${response.ingredients.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                    <p><strong>Instructions:</strong></p>
                    <ol>
                        ${response.instructions.map(i => `<li>${i}</li>`).join('')}
                    </ol>
                </div>
                <button id="use-recipe-btn" class="btn-primary" style="width: 100%; margin-top: 20px;">
                    <i class="fas fa-save"></i> Use This Recipe
                </button>
            `;
            
            document.getElementById('use-recipe-btn').addEventListener('click', () => {
                // Pre-fill the recipe form with the AI-generated content
                document.getElementById('recipe-name').value = response.name;
                document.getElementById('recipe-ingredients').value = response.ingredients.join('\n');
                document.getElementById('recipe-instructions').value = response.instructions.join('\n');
                document.getElementById('recipe-cuisine').value = response.cuisine;
                document.getElementById('recipe-time').value = response.time;
                
                // Close AI modal and open recipe modal
                closeModals();
                openRecipeModal();
            });
        } catch (error) {
            document.getElementById('ai-modal-body').innerHTML = `
                <div class="ai-response" style="border-left-color: #f44336;">
                    <h3>Error</h3>
                    <p>Failed to generate recipe. Please try again later.</p>
                </div>
            `;
        }
    }
    
    async function analyzeNutritionWithAI() {
        if (recipes.length === 0) {
            alert('No recipes available to analyze. Please add some recipes first.');
            return;
        }
        
        openAiModal('AI Nutrition Analysis');
        
        // Show loading state
        document.getElementById('ai-modal-body').innerHTML = `
            <div class="ai-loading">
                <i class="fas fa-spinner"></i>
                <p>Analyzing recipes for nutritional information...</p>
            </div>
        `;
        
        try {
            // Simulate AI API call (in a real app, you would call an actual AI API)
            const response = await simulateAIRequest('nutrition-analysis');
            
            document.getElementById('ai-modal-body').innerHTML = `
                <div class="ai-response">
                    <h3>Nutritional Insights</h3>
                    <p>Based on analysis of your recipes, here are some nutritional insights:</p>
                    <ul>
                        ${response.insights.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                    <h4 style="margin-top: 20px;">Recipe Health Scores</h4>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background-color: #f1f1f1;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Recipe</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Health Score</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Calories</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Protein</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Carbs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${response.recipes.map(recipe => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${recipe.name}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${recipe.score}/10</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${recipe.calories}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${recipe.protein}g</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${recipe.carbs}g</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <h4 style="margin-top: 20px;">Recommendations</h4>
                    <ul>
                        ${response.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
        } catch (error) {
            document.getElementById('ai-modal-body').innerHTML = `
                <div class="ai-response" style="border-left-color: #f44336;">
                    <h3>Error</h3>
                    <p>Failed to analyze nutrition. Please try again later.</p>
                </div>
            `;
        }
    }
    
    function openAiModal(title) {
        document.getElementById('ai-modal-title').textContent = title;
        aiModal.style.display = 'block';
    }
    
    // Simulated AI Functions (in a real app, replace with actual API calls)
    function simulateAIRequest(type) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (type === 'recipe-generation') {
                    const cuisines = ['Italian', 'Mexican', 'Indian', 'Chinese', 'Mediterranean', 'American'];
                    const proteins = ['chicken', 'beef', 'fish', 'tofu', 'lentils', 'beans'];
                    const vegetables = ['bell peppers', 'carrots', 'broccoli', 'spinach', 'zucchini', 'mushrooms'];
                    const carbs = ['rice', 'pasta', 'quinoa', 'potatoes', 'bread', 'couscous'];
                    
                    const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
                    const randomProtein = proteins[Math.floor(Math.random() * proteins.length)];
                    const randomVeg1 = vegetables[Math.floor(Math.random() * vegetables.length)];
                    const randomVeg2 = vegetables[Math.floor(Math.random() * vegetables.length)];
                    const randomCarb = carbs[Math.floor(Math.random() * carbs.length)];
                    
                    const recipeName = `${randomCuisine} ${randomProtein} with ${randomVeg1} and ${randomCarb}`;
                    
                    resolve({
                        name: recipeName,
                        cuisine: randomCuisine,
                        time: Math.floor(Math.random() * 60) + 20,
                        ingredients: [
                            `1 lb ${randomProtein}`,
                            `2 cups ${randomCarb}`,
                            `1 ${randomVeg1}, diced`,
                            `1 ${randomVeg2}, sliced`,
                            '2 cloves garlic, minced',
                            '1 tbsp olive oil',
                            'Salt and pepper to taste',
                            '1 tsp dried herbs (optional)'
                        ],
                        instructions: [
                            'Heat oil in a large pan over medium heat.',
                            `Add ${randomProtein} and cook until browned.`,
                            `Add ${randomVeg1} and ${randomVeg2}, cook until softened.`,
                            'Add garlic and cook for 1 minute until fragrant.',
                            `Add ${randomCarb} and stir to combine.`,
                            'Season with salt, pepper, and herbs.',
                            'Cook for another 5-10 minutes until everything is heated through.',
                            'Serve hot and enjoy!'
                        ]
                    });
                } else if (type === 'nutrition-analysis') {
                    const analyzedRecipes = recipes.slice(0, 5).map(recipe => ({
                        name: recipe.name,
                        score: Math.floor(Math.random() * 5) + 5,
                        calories: Math.floor(Math.random() * 800) + 200,
                        protein: Math.floor(Math.random() * 40) + 5,
                        carbs: Math.floor(Math.random() * 60) + 10
                    }));
                    
                    resolve({
                        insights: [
                            'Your recipes have a good balance of protein and carbohydrates.',
                            'Consider adding more leafy greens to increase fiber content.',
                            'Watch out for recipes with high sodium content.',
                            'Most of your recipes fall in the moderate calorie range.'
                        ],
                        recipes: analyzedRecipes,
                        recommendations: [
                            'Try substituting olive oil for butter in some recipes to reduce saturated fat.',
                            'Add a side salad to balance out heavier meals.',
                            'Consider using whole grain alternatives where possible.',
                            'Experiment with herbs and spices to reduce salt usage.'
                        ]
                    });
                }
            }, 1500); // Simulate network delay
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
        if (e.target === aiModal) {
            aiModal.style.display = 'none';
        }
    });
});

