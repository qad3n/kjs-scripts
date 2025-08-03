/* ---------------------------------------------------------

Mass game data remover script
Essentially a lightweight script based alternative to "Item Obliterator"
Reads from globals in startup_scripts/globals.js
To be used with REI.js to hide the items as well

Also servers as an alternative to  "BadMobs" and other
entity removing mods

Requires LootJS, AchievementsJS

PLEASE CREDIT ME IF YOU USE THIS SCRIPT IN YOUR MODPACK
@qad3n

DOES NOT:

- Prevent player from dropping item
- Remove item from player inventory
- Delete / swap blocks during or after world generation

--------------------------------------------------------- */

const ENCHANTNBT = [ /^.+:(.*(sword|pickaxe|shovel|axe|hoe|helmet|chestplate|leggings|boots|gloves|bow|lance|slayer|rod).*)$/ ]
const POTIONNBT = [ /^.+:.*potion.*/, /^.+:tipped_arrow$/ ]
const cancelIfRemoved = mob =>
{
	if (global.REMOVED_MOBS.includes(mob.entity.type))
		mob.cancel()
		
	// Example: For removing items from entity hands or armor slots
	// (Removes crossbows from piglins)
	if (mob.entity.type.toString() == "minecraft:piglin") 
		mob.entity.setItemSlot(0, "minecraft:air")
}

// Main
function objectRemover()
{
	const item = global.REMOVED

	// Block interaction
	BlockEvents.rightClicked(click =>
	{
		const id = click.block.id
		if (item.includes(id) && !global.TCHESTS.includes(id)) 
			click.cancel()
	})

	// Block placement
	BlockEvents.placed(click =>
	{
		if (item.includes(click.block.id))
		{
			click.item.count-- // BROKEN. TODO: Fix
			click.cancel()
		}
	})

	// Entity / mob remover
	EntityEvents.checkSpawn(cancelIfRemoved)
	EntityEvents.spawned(cancelIfRemoved)

	// Tag remover
	ServerEvents.tags("item", tag => { tag.removeAllTagsFrom(global.REMOVED) })

	// Recipe remover
	ServerEvents.recipes(recipe =>
	{
		item.forEach(rule => recipe.remove({ output: rule }))
		
		global.CATEGORIES.forEach(category =>
		{
			recipe.remove({ output: category })
			recipe.remove({ type: category })
		})
	})

	LootJS.modifiers(loot =>
	{
		// Removes items from loot tables
		loot.addLootTypeModifier(
		[
			LootType.UNKNOWN, LootType.BLOCK, LootType.ENTITY,
			LootType.CHEST, LootType.FISHING, LootType.GIFT
		]).removeLoot(item)

		// Removes items from loot tables
		// Secondary fallback for mods that force late data generation
		loot.addLootTableModifier(/.*/).removeLoot(item)

		// Specific to b174, removes sticks from leaves loot tables
		loot.addLootTableModifier(/minecraft:blocks\/.*_leaves/).removeLoot("minecraft:stick")

		// Removes varios kinds of NBT data (Enchantments, Potions)
		loot
		.addLootTableModifier(/.*/)
		.functions(Ingredient.of(ENCHANTNBT), set_nbt =>
		{
			set_nbt.customFunction(
			{
				function: "set_nbt",
				tag: "{Enchantments:[],StoredEnchantments:[]}"
			})
		})
		.functions(Ingredient.of(POTIONNBT), set_nbt =>
		{
			set_nbt.customFunction(
			{
				function: "set_nbt",
				tag: "{Potion:\"minecraft:water\",CustomPotionEffects:[],CustomPotionColor:0}"
			})
		})
	})

	// Advancement / achievement remover
	AdvJSEvents.advancement(achievement => 
	{
		global.MOD_ACHIEVEMENTS.forEach(mod => { achievement.remove({ mod: mod }) })
		global.ACHIEVEMENTS.forEach(path => { achievement.remove(`minecraft:${path}`) })
	})
}
objectRemover()
