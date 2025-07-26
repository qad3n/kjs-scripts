// Item obliterator alternatives testing script
// Works on 1.20.1
// Requires LootJS, AchievementsJS, EntityJS

/*

Currently does not:

- Remove item from inventory
- Remove item from world (or prevent item pickup)
- Remove item from creative menu
- Remove tags
- Swap removed blocks with alternatives, or air


*/

function objectRemover(item) 
{
	BlockEvents.rightClicked(click => 
	{
		if (item.includes(click.block.id)) 
			click.cancel()
	})
	
	BlockEvents.placed(click =>
	{
		// Attempt
		if (item.includes(click.block.id)) 
		{
			click.item.count-- // Not sure if this will always work
			click.cancel()
		}
	})
	
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
		loot.addLootTypeModifier(
		[
			LootType.UNKNOWN, LootType.BLOCK, LootType.ENTITY,
			LootType.CHEST, LootType.FISHING, LootType.GIFT
		]).removeLoot(item)
		
		// Secondary fallback, seems to work for mods that generate tables late
		loot.addLootTableModifier(/.*/).removeLoot(item)
	})
	
	/*ServerEvents.tags('item', event => 
	{
		// Example
		global.REMOVED.forEach(tag => 
		{
			event.removeAll(tag)
		})
	})*/
}
objectRemover(global.REMOVED)

// Alternative for BadMobs, works exactly the same
// Fallback in the event a mod spawns a mod, or a spawner exists with a removed mob
function entityRemover() 
{
	const cancelIfRemoved = mob => 
	{
		if (global.REMOVED_MOBS.includes(mob.entity.type)) 
			mob.cancel()
			
		// Example for replacing items in entity slots
		if (mob.entity.type.toString() == "minecraft:piglin") 
			mob.entity.setItemSlot(0, "minecraft:air")
	}

	EntityEvents.checkSpawn(cancelIfRemoved)
	EntityEvents.spawned(cancelIfRemoved)
}
entityRemover()

// Could be one pattern, patterns are overdone, split for readability
const ENCHANTNBT = [ /^.+:(.*(sword|pickaxe|shovel|axe|hoe|helmet|chestplate|leggings|boots|gloves|bow|lance|slayer|rod).*)$/ ]
const POTIONNBT = [ /^.+:.*potion.*/, /^.+:tipped_arrow$/ ]
function nbtRemover() 
{
	
	LootJS.modifiers(mod => 
	{
		mod
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
}
nbtRemover()

const MODS = [ "repurposed_structures", "ironfurnaces", "supplementaries", "chalk" ]
const ADVANCEMENTS  = [ "root", "enter_end_gateway", "kill_dragon", "dragon_egg", "elytra", "respawn_dragon", "find_end_city", "levitate", "dragon_breath" ]
function achievementRemover()
{
	AdvJSEvents.advancement(event => 
	{ 
		MODS.forEach(mod => { event.remove({ mod: mod }) }) 
		
		ADVANCEMENTS.forEach(name => event.remove(`minecraft:end/${name}`));
	})
}
achievementRemover()

function dropRemover()
{
	// Example removal such as removing sticks dropping from leaves
	LootJS.modifiers(leaves => { leaves.addLootTableModifier(/minecraft:blocks\/.*_leaves/).removeLoot("minecraft:stick") })
} 
dropRemover()

function tagRemover()
{
	ServerEvents.tags('item', event => 
	{
		event.removeAll("supplementaries:black")
		event.removeAll("curios:belt")
	})
}
tagRemover()
