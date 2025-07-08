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
const idCounts = {}
const makeID = (out, type) => 
{
	const safe = out.replace(/[/:]/g, '_')
	const n = idCounts[safe] = (idCounts[safe] ?? 0) + 1
	return `kubejs:auto/${type ? type + '_' : ''}${safe}${n > 1 ? '_' + (n - 1) : ''}`
}

// Cant do it like this cause Rhino limitations...? Default param limitations? Or am I dumb?
// Example:
		// const addShapeless = (event, out, n = 1, ing, id) => event.shapeless(Item.of(out, n), ing).id(id)
const applyCountDefault = n => n === undefined ? 1 : n

const addShapeless = (event, out, n, ing, id) => 
{
	n = applyCountDefault(n)
	return event.shapeless(Item.of(out, n), ing).id(id)
}

const addShaped = (event, out, n, pat, key, id) => 
{
	n = applyCountDefault(n)
	return event.shaped(Item.of(out, n), pat, key).id(id)
}

const addStoneCutter = (event, out, n, input, id) => 
{
	n = applyCountDefault(n)
	return event.stonecutting(Item.of(out, n), input).id(id)
}

let DEFAULT_TEMPLATE = 'minecraft:netherite_upgrade_smithing_template'
const addSmithing = (event, out, base, add, template, id) => 
{
	if (template === undefined) 
		template = DEFAULT_TEMPLATE
	return event.smithing(out, template, base, add).id(id)
}

const makeCooker = (method, defTime) => (event, out, input, xp, time, id) => 
{
	if (xp === undefined) 
		xp = 0
	if (time === undefined) 
		time = defTime
	return event[method](out, input).xp(xp).cookingTime(time).id(id)
}

const addCook = 
{
	smelting: makeCooker('smelting', 200),
	blasting: makeCooker('blasting', 100),
	smoking: makeCooker('smoking', 100),
	campfire: makeCooker('campfireCooking', 600)
}

ServerEvents.recipes(event => 
{
	const removedOutputs = new Set()
	
	RECIPES.forEach(r => 
	{
		if (r.type === 'remove') 
		{
			if (r.id) 
				event.remove({ id: r.id })
			else if (r.output) 
				event.remove({ output: r.output })
			return
		}
		
		if (r.inputs && !r.ingredients)
			r.ingredients = r.inputs
		if (r.type === 'shaped' && r.ingredients && !r.keys)
			r.keys = r.ingredients
		
		if (r.type === 'campfireCooking')
			r.type = 'campfire'
		else if (r.type === 'stonecut')
			r.type = 'stonecutting'
		
		const recipeId = r.id || makeID(r.output, r.type)
		const out = r.output
		const replace = r.replace !== undefined ? r.replace : true
		
		if (replace && !removedOutputs.has(out)) 
		{
			event.remove({ output: out })
			removedOutputs.add(out)
		}
		
		const dispatch = 
		{
			shapeless: () => addShapeless(event, out, r.count, r.ingredients, recipeId),
			shaped: () => addShaped(event, out, r.count, r.pattern, r.keys, recipeId),
			smithing: () => addSmithing(event, out, r.base, r.addition, r.template, recipeId),
			smelting: () => addCook.smelting(event, out, r.input, r.xp, r.cookingTime, recipeId),
			blasting: () => addCook.blasting(event, out, r.input, r.xp, r.cookingTime, recipeId),
			smoking: () => addCook.smoking(event, out, r.input, r.xp, r.cookingTime, recipeId),
			campfire: () => addCook.campfire(event, out, r.input, r.xp, r.cookingTime, recipeId),
			stonecutting: () => addStoneCutter(event, out, r.count, r.input, recipeId)
		}
		
		if (!dispatch[r.type]) 
			throw new Error("Unknown 'type' (" + r.type + ') for ' + out)
			
		dispatch[r.type]()
	})
})
