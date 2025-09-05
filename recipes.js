/*
---------------------------------------------------------

@ qad3n | https://github.com/qad3n

https://github.com/qad3n/KJSScripts

Recipe handler script V 1.0

PLEASE CREDIT ME IF YOU USE THIS SCRIPT IN YOUR MODPACK

---------------------------------------------------------

*/

// Just define your recipes here:
const RECIPES = 
[
	
]

/*

========= INFO ===============================================================

Recipes can be defined as replaced, this is true by default
This will remove all existing recipes for that item
Set this variable to false if you only intend to add a recipe to an item

This script has multi recipe support, if a recipe is defined as replaced and then 
another recipe for that same item is defined later,
both of your custom recipes will exist

If you declare the removal of the recipe and then declare a recipe, the removal is ignored
event if the removal is after the recipe is defined in the array

========= INFO ===============================================================
*/

/* EXAMPLES
	// Shapeless example
	{ output: "minecraft:red_dye", type: "shapeless", ingredients: ["minecraft:poppy"] },
	{ output: "minecraft:red_dye", type: "shapeless", ingredients: ["minecraft:stone"] }, 
	
	// Shapeless recipe using "inputs" and no replacement of original recipe (Up to nine inputs, more may cause issues)
	{ output: "minecraft:orange_dye", type: "shapeless", inputs: ["minecraft:red_dye", "minecraft:yellow_dye"], replace: false },
	
	// Shaped recipe with pattern and ingredients
	{ output: "minecraft:ender_chest", type: "shaped", pattern: ["OOO", "OCO", "OOO"], ingredients: { O: "minecraft:obsidian", C: "minecraft:echo_shard" } },
	
	// Shaped recipe using "keys" and disabling original recipe removal
	{ output: "minecraft:glowstone", type: "shaped", pattern: ["PP", "PP"], keys: { P: "minecraft:glowstone_dust" }, replace: false },
	
	// Smithing recipe with custom template
	{ output: "minecraft:netherite_pickaxe", type: "smithing", base: "minecraft:diamond_pickaxe", addition: "minecraft:netherite_ingot", template: "minecraft:netherite_upgrade_smithing_template" },
	
	// Smelting recipe with XP and cooking time
	{ output: "minecraft:glass", type: "smelting", input: "minecraft:sand", xp: 0.1, cookingTime: 200 },
	
	// Blasting recipe
	{ output: "minecraft:iron_ingot", type: "blasting", input: "minecraft:iron_ore", xp: 0.7, cookingTime: 100 },
	
	// Smoking recipe
	{ output: "minecraft:cooked_beef", type: "smoking", input: "minecraft:beef", xp: 0.35, cookingTime: 100 },
	
	// Campfire cooking recipe
	{ output: "minecraft:cooked_cod", type: "campfire", input: "minecraft:cod", xp: 0.35, cookingTime: 600 },
	
	// Stonecutting recipe with multiple output count
	{ output: "minecraft:stone_brick_slab", type: "stonecutting", input: "minecraft:stone_bricks", count: 2 },
	
	// Stonecut recipe (alias of stonecutting) with replace disabled
	{ output: "minecraft:stone_brick_stairs", type: "stonecut", input: "minecraft:stone_bricks", count: 1, replace: false },
	
	// Recipe removal (deletes all recipes for given output)
	{ output: "minecraft:golden_apple", type: "remove" }
*/
	
// Fun function if you mess with dye recipes or just want to redo a dyed item
// This isnt really finished or properly implmeneted, just messing around
/*
	const COLORS = 
	[
		"red", "orange", "yellow", "lime", "green", "cyan", "blue", "purple", "magenta", 
		"pink", "light_blue", "light_gray", "gray", "brown", "black", "white"
	]
	const addDyedVariants = function(template, baseColor) 
	{
		COLORS.forEach(col => 
		{
			if (col === baseColor) 
				return
				
			RECIPES.push(
			{
				// You can modify this to be whatever type of recipe you want
				output: template.replace("%COLOR%", col),
				type: "shapeless",
				inputs: [template.replace("%COLOR%", baseColor), `minecraft:${col}_dye`]
			})
		})
	}
*/

// ----------------------------------------------------------------------------------------------------

// BACKEND SCRIPT STUFF BELOW (Technology)

// ----------------------------------------------------------------------------------------------------

// Deduplicator technology (secret advanced technology) ???
const recipeIdCounts = {}
const makeRecipeId = (outputId, type) => 
{
	const safeId = outputId.replace(/[/:]/g, "_")
	const index = recipeIdCounts[safeId] = (recipeIdCounts[safeId] ?? 0) + 1
	return `kubejs:auto/${type ? type + '_' : ''}${safeId}${index > 1 ? '_' + (index - 1) : ''}`
}

// Cant do it like this cause Rhino limitations...? Default param limitations? Or am I dumb?
// Example:
		// const addShapeless = (event, out, n = 1, ing, id) => event.shapeless(Item.of(out, n), ing).id(id)
const ensureCount = count => count === undefined ? 1 : count

const getOutputId = o => typeof o === "object" ? (o.item || o.id || o.name) : o

const createOutputStack = recipe =>
{
	let outputId = getOutputId(recipe.output)
	let count = ensureCount(typeof recipe.output === "object" && recipe.output.count !== undefined ? recipe.output.count : recipe.count)
	let nbt = (typeof recipe.output === "object" && recipe.output.nbt !== undefined) ? recipe.output.nbt : recipe.nbt
	let stack = Item.of(outputId, count)
	if (nbt !== undefined) stack = stack.withNBT(nbt)
	return stack
}

const addShapelessRecipe = (event, outputId, count, ingredients, recipeId) => 
{
	count = ensureCount(count)
	return event.shapeless(Item.of(outputId, count), ingredients).id(recipeId)
}

const addShapedRecipe = (event, outputId, count, pattern, keyMap, recipeId) => 
{
	count = ensureCount(count)
	return event.shaped(Item.of(outputId, count), pattern, keyMap).id(recipeId)
}

const addStonecuttingRecipe = (event, outputId, count, inputItem, recipeId) => 
{
	count = ensureCount(count)
	return event.stonecutting(Item.of(outputId, count), inputItem).id(recipeId)
}

let defaultSmithingTemplate = "minecraft:netherite_upgrade_smithing_template"
const addSmithingRecipe = (event, outputStack, baseItem, additionItem, templateId, recipeId) => 
{
	if (templateId === undefined)
		templateId = defaultSmithingTemplate
	return event.smithing(outputStack, templateId, baseItem, additionItem).id(recipeId)
}

const makeCookHandler = (methodName, defaultTime) => (event, outputStack, inputItem, xp, time, recipeId) => 
{
	if (xp === undefined)
		xp = 0
	if (time === undefined)
		time = defaultTime
	return event[methodName](outputStack, inputItem).xp(xp).cookingTime(time).id(recipeId)
}

const cookHandlers = 
{
	smelting: makeCookHandler("smelting", 200),
	blasting: makeCookHandler("blasting", 100),
	smoking: makeCookHandler("smoking", 100),
	campfire: makeCookHandler("campfireCooking", 600)
}

ServerEvents.recipes(event => 
{
	const removedOutputIds = new Set()
	
	RECIPES.forEach(recipe => 
	{
		if (recipe.type === "remove") 
		{
			if (recipe.id) 
				event.remove({ id: recipe.id })
			else if (recipe.output) 
				event.remove({ output: getOutputId(recipe.output) })
			return
		}
		
		if (recipe.inputs && !recipe.ingredients)
			recipe.ingredients = recipe.inputs
		if (recipe.type === "shaped" && recipe.ingredients && !recipe.keys)
			recipe.keys = recipe.ingredients
		
		if (recipe.type === "campfireCooking")
			recipe.type = "campfire"
		else if (recipe.type === "stonecut")
			recipe.type = "stonecutting"
		
		const outputId = getOutputId(recipe.output)
		const recipeId = recipe.id || makeRecipeId(outputId, recipe.type)
		const replace = recipe.replace !== undefined ? recipe.replace : true
		
		if (replace && !removedOutputIds.has(outputId)) 
		{
			event.remove({ output: outputId })
			removedOutputIds.add(outputId)
		}
		
		const outputStack = createOutputStack(recipe)
		
		const handlers = 
		{
			shapeless: () => event.shapeless(outputStack, recipe.ingredients).id(recipeId),
			shaped: () => event.shaped(outputStack, recipe.pattern, recipe.keys).id(recipeId),
			smithing: () => addSmithingRecipe(event, outputStack, recipe.base, recipe.addition, recipe.template, recipeId),
			smelting: () => cookHandlers.smelting(event, outputStack, recipe.input, recipe.xp, recipe.cookingTime, recipeId),
			blasting: () => cookHandlers.blasting(event, outputStack, recipe.input, recipe.xp, recipe.cookingTime, recipeId),
			smoking: () => cookHandlers.smoking(event, outputStack, recipe.input, recipe.xp, recipe.cookingTime, recipeId),
			campfire: () => cookHandlers.campfire(event, outputStack, recipe.input, recipe.xp, recipe.cookingTime, recipeId),
			stonecutting: () => addStonecuttingRecipe(event, outputStack.getId(), outputStack.getCount(), recipe.input, recipeId)
		}
		
		if (!handlers[recipe.type]) 
			throw new Error("Unknown 'type' (" + recipe.type + ") for: " + outputId)
			
		handlers[recipe.type]()
	})
})
