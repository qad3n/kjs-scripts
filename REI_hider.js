/*---------------------------------------------------------

@ qad3n | https://github.com/qad3n

https://github.com/qad3n/KJSScripts

(WRITTEN FOR MINECRAFT 1.20.1)

THIS IS A CLIENT SCRIPT

---------------------------------------------------------*/

// Simple REI hider script to be used in conjunction with obliterator.js script.

REIEvents.hide("item", event =>
{
	global.REMOVED.forEach(item => event.hide(item))
	
	// Example for hiding items with specific nbt, such as the ominous banner
	event.hide(Ingredient.customNBT(Ingredient.of("minecraft:white_banner"), nbt => Array.isArray(nbt.BlockEntityTag?.Patterns) && nbt.BlockEntityTag.Patterns.length > 0))
})
REIEvents.hide("fluid", event => { global.FLUIDS.forEach(fluid => event.hide(fluid)) })
REIEvents.removeCategories(event => { global.CATEGORIES.forEach(category => event.remove(category)) })
