/*---------------------------------------------------------

@ qad3n | https://github.com/qad3n

https://github.com/qad3n/KJSScripts

PLEASE CREDIT ME IF YOU USE THIS SCRIPT IN YOUR MODPACK

(WRITTEN FOR MINECRAFT 1.20.1)

THIS IS A SERVER SCRIPT

---------------------------------------------------------*/

/*---------------------------------------------------------

Mass game data remover script, essentially a lightweight
script based alternative to the "Item Obliterator" mod.

Create a global array in a file in startup_scripts and have the
function below read from that array.

Create an array for mobs you want to remove as well.

My array names are "REMOVED" and "REMOVED_ENTITIES".

I also use simple KubeJS code to read from the same array in a
client script that hides the items from the REI menu.

These two scripts in combination completely remove items, aside from
blocks that generate in structures or worlds. Use BlockSwapper for that.

THIS SCRIPT REQUIRES: LootJS, AchievementsJS

---------------------------------------------------------*/

// I am sure these could be simplified, but they work
const ENCHANTNBT = [/^[^:]+:.*(sword|pickaxe|shovel|axe|hoe|helmet|chestplate|leggings|boots|gloves|bow|lance|slayer|rod).*/]
const POTIONNBT = [/^[^:]+:.*potion.*/, /^[^:]+:tipped_arrow$/]

const purgeVisible = plr => 
{
	const menu = plr.openedMenu ?? plr.containerMenu
	if (!menu || !menu.slots) 
		return
		
	menu.slots.forEach(slot => 
	{
		const st = slot.item
		if (st && !st.empty && Ingredient.of(global.REMOVED).test(st))
			st.setCount(0)
	})
}

const cancelIfRemoved = ent =>
{
	// Removes mob entities
	const nt = ent.entity
	
	if (global.REMOVED_ENTITIES.includes(nt.type))
		ent.cancel()
		
	// Removes item entities
	if (nt.type === "minecraft:item" && Ingredient.of(global.REMOVED).test(nt.item)) 
		ent.cancel()
}

// Main
function objectRemover()
{
	// Inventory / container purger
	PlayerEvents.inventoryChanged(cont => { purgeVisible(cont.player) })
	PlayerEvents.inventoryOpened(cont => { purgeVisible(cont.player) })
	
	// Entity / mob remover
	EntityEvents.checkSpawn(cancelIfRemoved)
	EntityEvents.spawned(cancelIfRemoved)
	
	// Deny block interaction
	BlockEvents.rightClicked(click =>
	{
		const id = click.block.id
		if (global.REMOVED.includes(id) && !global.TCHESTS.includes(id)) 
			click.cancel()
	})
	
	// Tag remover
	ServerEvents.tags("item", tag => { tag.removeAllTagsFrom(global.REMOVED) })

	// Recipe and recipe inclusion remover
	ServerEvents.recipes(recipe =>
	{
		global.REMOVED.forEach(rule => recipe.remove({ output: rule }))
		
		global.CATEGORIES.forEach(category =>
		{
			recipe.remove({ output: category })
			recipe.remove({ type: category })
		})
	})
	
	// Loot table modifier
	LootJS.modifiers(loot =>
	{
		// Loot table remover
		loot.addLootTypeModifier(
		[
			LootType.UNKNOWN, LootType.BLOCK, LootType.ENTITY,
			LootType.CHEST, LootType.FISHING, LootType.GIFT
		]).removeLoot(global.REMOVED)
		
		// Loot table remover (fallback)
		// Secondary fallback for mods that force late data generation
		loot.addLootTableModifier(/.*/).removeLoot(global.REMOVED)
		
		// Removes varios kinds of NBT data (Enchantments, Potions)
		// Useful if a mod adds loot pools but no data to modify it
		loot.addLootTableModifier(/.*/).functions(Ingredient.of(ENCHANTNBT), set_nbt =>
		{
			set_nbt.customFunction(
			{
				function: "set_nbt",
				tag: "{Enchantments:[],StoredEnchantments:[]}"
			})
		}).functions(Ingredient.of(POTIONNBT), set_nbt =>
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
	
	/* 
	
	The following really only serve as fallbacks (or an anticheat?)
	Should never happen, item / inventory / entity deletion will
	come first. The code more serves as proof of concept / testing.
	
	Uncomment them and include them if you happen to need them based
	on your current environment.
	
	/*
	BlockEvents.placed(click =>
	{
		const id = click.block.id
		if (!REMOVED_SET.has(click.block.id))
			return
			
		click.cancel()
		
		[click.player.mainHandItem, click.player.offHandItem].forEach(slot =>
		{
			if (slot && !slot.empty && Ingredient.of(global.REMOVED).test(slot))
				slot.setCount(0)
		})
	})
	
	ItemEvents.canPickUp(itm =>
	{
		const it = itm.item
		if (it && !it.empty && Ingredient.of(global.REMOVED).test(it))
			itm.cancel()
	})
	
	ItemEvents.pickedUp(itm => 
	{
		const it = itm.item
		if (it && !it.empty && Ingredient.of(global.REMOVED).test(it))
			it.setCount(0)
	})
	
	ItemEvents.dropped(itm =>
	{
		const it = itm.item
		if (it && !it.empty && Ingredient.of(global.REMOVED).test(it))
			itm.cancel()
	})
	
	ServerEvents.tick(event =>
	{
		event.server.entities.filterSelector("@e[type=item]").forEach(it => 
		{
			const st = it.item
			if (st && !st.empty && Ingredient.of(global.REMOVED).test(st))
				it.kill()
		})
	})
	
	*/
}
objectRemover()
