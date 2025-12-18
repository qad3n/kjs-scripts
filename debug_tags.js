const Component = Java.loadClass('net.minecraft.network.chat.Component')
const Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const Result = Java.loadClass('net.minecraftforge.eventbus.api.Event$Result')
const RenderNameTagEvent = Java.loadClass('net.minecraftforge.client.event.RenderNameTagEvent')

const MAX_NAMETAG_DISTANCE_BLOCKS = 64.0
const MAX_NAMETAG_DISTANCE_SQR = MAX_NAMETAG_DISTANCE_BLOCKS * MAX_NAMETAG_DISTANCE_BLOCKS

NativeEvents.onEvent(RenderNameTagEvent, event =>
{
	const mc = Minecraft.getInstance()
	if (!mc || !mc.options || !mc.options.renderDebug)
		return
		
	const viewer = mc.getCameraEntity ? mc.getCameraEntity() : mc.player
	if (!viewer)
		return
		
	const entity = event.getEntity()
	if (!entity)
		return
		
	if (entity instanceof Player)
		return
		
	if (entity.distanceToSqr(viewer) > MAX_NAMETAG_DISTANCE_SQR)
		return
		
	const idComponent = Component.literal(String(entity.getId()))
	
	event.setContent(idComponent)
	event.setResult(Result.ALLOW)
})
