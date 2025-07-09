// ---------------------------------------------------------
// @ qad3n
// PLEASE CREDIT ME IF YOU USE THIS SCRIPT IN YOUR MODPACK
// ---------------------------------------------------------
// 
// KUBEJS CUSTOM TOOLTIP SCRIPT (WRITTEN FOR MINECRAFT 1.20.1)

// Keeping this array here instead of a global for now, may move. Not sure.
const ITEMS = 
[
	// Examples: (uncomment and reload to view)
	// { ID: "minecraft:stone",  description: "line one" },
	// { ID: "minecraft:dirt",  description: ["line one", "line two", "line three"] },	
]

ItemEvents.tooltip(event =>
{
	event.addAdvanced(Ingredient.all, (item, advanced, text) => 
	{
		// Wipes all existing formatting
		const raw = text.get(0).string
		text.set(0, Text.of(raw).white().italic(false))
		
		// Wipes all existing tooltips
		for (let i = text.size() - 1; i >= 1; i--) 
			text.remove(i)
		
		// Rebuilds debug tooltips info + NBT data
		{
			if (!advanced)
				return
		
			text.add(Text.gray(item.id))
			
			if (!item.nbt)
				return
				
			text.add(Text.of("NBT: ").append(Text.prettyPrintNbt(item.nbt)))
		}
	})
	
	// Build custom tooltips
	ITEMS.forEach(obj => 
	{
		event.addAdvanced(obj.ID, (item, advanced, text) => 
		{
			if (!event.shift) 
				return
			
			const lines = Array.isArray(obj.description) ? obj.description : String(obj.description).split("\n")
			
			for (let i = 0; i < lines.length; i++)
				text.add(Text.gray(lines[i]))
		})
	})
})
