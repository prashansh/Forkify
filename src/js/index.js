 // Global app controller

import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from './models/Likes'
import {elements , renderLoader, clearLoader} from './base'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'


/*
* - Search object
* - Current recipe object
* - Shopping list object
* - liked recipes
*/ 

const state = {};

/*
* Search Controller
*/ 

const controlSearch = async () =>{
    // 1. Get query from view
    const query =  searchView.getInput();//TODO
    // TESTING
    // const query = 'pizza';

    if(query){ 

        // 2. New Search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            // 4. Search for recipes
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);

        }
        catch(error){
            alert('error in searching recipe');
        }    

    }

}

elements.searchForm.addEventListener('submit',e =>{
    e.preventDefault();
    controlSearch();
    
});

// TESTING
// window.addEventListener('load',e =>{
//     e.preventDefault();
//     controlSearch();
    
// });

elements.searchResPages.addEventListener('click',e =>{

    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto,10);
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);        
    }

});


/*
* Recipe Controller
*/ 

const controlRecipe = async () => {

    const id = window.location.hash.replace('#',"");
    // console.log(id);

    if(id){

        // Prepare UI for changes        
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        // Create new recipe object 
        state.recipe = new Recipe(id);
        // TESTING 
        // window.r = state.recipe;

        try{
            // Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            clearLoader();
            // console.log(state.recipe);
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );


        }catch(error){
            alert('Error in loading recipe');
        }
        

        
    }

};

// window.addEventListener('hashchange',controlRecipe);
// window.addEventListener('load',controlRecipe);

['hashchange','load'].forEach(e=>{window.addEventListener(e,controlRecipe)})

/*
* List Controller
*/ 

const controlList = () =>{
    //Create a New list if there is none yet
    if(!state.list)
        state.list = new List();

    // Add each ingredients to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click',e => {

    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if(e.target.matches('.shopping__delete,.shopping__delete *')){

        // Delete from state
        state.list.deleteItem(id);

        //Delete fom UI
        listView.deleteItem(id);

    // Handel the count update    
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value,10);
        state.list.updateCount(is,val);
    }

});

/*
* Like Controller
*/ 

// Testing
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {

    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    //User has not yet liked current recipe
    if(!state.likes.isLiked(currentId)){

        //Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        //toggle the like button
        likesView.toggleLikeBtn(true);

        // add like to the UI list
        likesView.renderLike(newLike);
        // console.log(state.likes);


     //User has liked current recipe   
    }else{

        //Remove like from the state
        state.likes.deleteLike(currentId);

        //Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentId);
        // console.log(state.likes);

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());

};

// Restore like recipes when page loads

window.addEventListener('load',() => {

    state.likes = new Likes();

    /// Restore likes
    state.likes.readStorage();

// Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the exiting likes 
    state.likes.likes.forEach(like => likesView.renderLike(like));
    

});


// Handing recipe button clicks
elements.recipe.addEventListener('click',e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        // Increase 
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // Add ingredits to the shooping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        // like controller
        controlLike();
    }

    // console.log(state.recipe);
});


