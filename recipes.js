/*---------------------------------------------------------

@ qad3n | https://github.com/qad3n

https://github.com/qad3n/KJSScripts

PLEASE CREDIT ME IF YOU USE THIS SCRIPT IN YOUR MODPACK

(WRITTEN FOR MINECRAFT 1.20.1)

---------------------------------------------------------*/

/*========= INFO ===============================================================

Recipes can be defined as replaced, this is true by default.
This will remove all existing recipes for that output item.
Set "replace: false" if you only intend to add a recipe.

This script has multi-recipe support.
If a recipe is defined as replaced and then another recipe for that same item is defined later, both custom recipes will exist.
If you declare the removal of a recipe and then declare a recipe for that output, the removal is ignored (your recipe takes priority).

Supported recipe types:
- Shapeless (standard shapeless crafting)
- Shaped (standard shaped crafting with pattern + keys)
- Smithing (base + addition + template)
- Smelting (furnace, supports xp + cookingTime)
- Blasting (blast furnace, supports xp + cookingTime)
- Smoking (smoker, supports xp + cookingTime)
- Campfire / campfireCooking (campfire, supports xp + cookingTime)
- Stonecutting / stonecut (stonecutter, supports output count)
- Remove (deletes all recipes for given output or specific id)

NBT support:
Outputs can specify custom NBT either with a top-level "nbt" property or using an object "{ item, count?, nbt? }".
NBT is merged with the items default NBT (default keys are preserved, custom keys override).
If no NBT is specified, recipes behave normally.

========= INFO ===============================================================*/

/* EXAMPLES:
 * 
	Shapeless recipe (potion upgrade with NBT)
	{ output: { item: "minecraft:potion", nbt: { Potion: "minecraft:swiftness" } }, type: "shapeless", ingredients: ["minecraft:potion", "minecraft:sugar"], replace: false },
	
	Shaped recipe (renamed compass with NBT)
	{ output: { item: "minecraft:compass", nbt: { display: { Name: '{"text":"Gaming compass","italic":false}' } } }, type: "shaped", pattern: [" R ", "RCR", " R "], keys: { R: "minecraft:redstone", C: "minecraft:compass" } },
	
	Smithing recipe (diamond to netherite sword with NBT)
	{ output: { item: "minecraft:netherite_sword", nbt: { display: { Nore: '{"text":"Gaming sword","italic":false}' } } }, type: "smithing", base: "minecraft:diamond_sword", addition: "minecraft:netherite_ingot", template: "minecraft:netherite_upgrade_smithing_template" },
	
	Smelting recipe (raw copper to copper ingot)
	{ output: "minecraft:copper_ingot", type: "smelting", input: "minecraft:raw_copper", xp: 0.7, cookingTime: 200},
	
	Blasting recipe (raw iron to iron ingot)
	{ output: "minecraft:iron_ingot", type: "blasting", input: "minecraft:raw_iron", xp: 0.7, cookingTime: 100 },
	
	Smoking recipe (beef to cooked beef)
	{ output: "minecraft:cooked_beef", type: "smoking", input: "minecraft:beef", xp: 0.35, cookingTime: 100 },
	
	Campfire cooking recipe (cod to cooked cod)
	{ output: "minecraft:cooked_cod", type: "campfire", input: "minecraft:cod", xp: 0.35, cookingTime: 600 },
	
	Stonecutting recipe (stone to 2 stone slabs)
	{ output: "minecraft:stone_slab", type: "stonecutting", input: "minecraft:stone", count: 2, replace: false },
	
	Stonecut alias recipe (stone bricks to stairs)
	{ output: "minecraft:stone_brick_stairs", type: "stonecut", input: "minecraft:stone_bricks", count: 1, replace: false },
	
	Recipe removal (removes all recipes for wooden sword)
	{ output: "minecraft:wooden_sword", type: "remove" }
*/

// Just define your recipes here:
const RECIPES = 
[
	
]

// ----------------------------------------------------------------------------------------------------

// BACKEND SCRIPT STUFF BELOW (Technology)

// ----------------------------------------------------------------------------------------------------

// Deduplicator
const recipeIdCounts = new Map()
const makeRecipeId = (outputId, type) =>
{
	const safeId = outputId.replace(/[/:]/g, "_")
	const current = recipeIdCounts.get(safeId) ?? 0
	
	recipeIdCounts.set(safeId, current + 1)
	
	return `kubejs:auto/${type ? type + '_' : ''}${safeId}${current > 0 ? '_' + current : ''}`
}

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

// Cant do it like this cause Rhino limitations...? Default param limitations? Or am I dumb?
// Example:
		// const addShapeless = (event, out, n = 1, ing, id) => event.shapeless(Item.of(out, n), ing).id(id)

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

const addSmithingRecipe = (event, outputStack, baseItem, additionItem, templateId, recipeId) =>
{
	if (templateId === undefined)
		templateId = "minecraft:netherite_upgrade_smithing_template"
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
