package cafe.managment.data.repository

import cafe.managment.data.model.Recipe
import cafe.managment.data.model.RecipeIngredient
import cafe.managment.data.network.ImportRecipesRequest
import cafe.managment.data.network.RecipeRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

class RecipesRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getRecipes(): List<Recipe> = api().getRecipes().recipes

    suspend fun createRecipe(name: String, category: String?, ingredients: List<RecipeIngredient>): Recipe =
        api().createRecipe(RecipeRequest(name = name, category = category, ingredients = ingredients)).recipe

    suspend fun updateRecipe(id: String, name: String, category: String?, ingredients: List<RecipeIngredient>): Recipe =
        api().updateRecipe(id, RecipeRequest(name = name, category = category, ingredients = ingredients)).recipe

    suspend fun deleteRecipe(id: String) {
        api().deleteRecipe(id)
    }

    suspend fun importRecipes(recipes: List<RecipeRequest>): List<Recipe> =
        api().importRecipes(ImportRecipesRequest(recipes = recipes)).recipes
}
