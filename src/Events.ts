import { GRoot } from ".";
import { InteractiveEvent } from "./event/DisplayObjectEvent";

export class Events {
    public static STATE_CHANGED: string = "fui_state_changed";
    public static XY_CHANGED: string = "fui_xy_changed";
    public static SIZE_CHANGED: string = "fui_size_changed";
    public static SIZE_DELAY_CHANGE: string = "fui_size_delay_change";
    public static CLICK_ITEM: string = "fui_click_item";
    public static SCROLL: string = "fui_scroll";
    public static SCROLL_END: string = "fui_scroll_end";
    public static DROP: string = "fui_drop";
    public static DRAG_START: string = "fui_drag_start";
    public static DRAG_MOVE: string = "fui_drag_move";
    public static DRAG_END: string = "fui_drag_end";
    public static PULL_DOWN_RELEASE: string = "fui_pull_down_release";
    public static PULL_UP_RELEASE: string = "fui_pull_up_release";
    public static GEAR_STOP: string = "fui_gear_stop";
    public static LOADER_COMPLETE: string = "fui_loader_complete";

    public static $event: InteractiveEvent = new InteractiveEvent();

    public static createEvent(type: string, target: Phaser.GameObjects.GameObject, source?: { target?: Phaser.GameObjects.GameObject, touchId?: number }): InteractiveEvent {
        this.$event.setTo(type, target, source ? (source.target || target) : target);
        this.$event.touchId = source ? (source.touchId || 0) : 0;
        this.$event.nativeEvent = source;
        this.$event["_stoped"] = false;
        return this.$event;
    }

    public static dispatch(type: string, target: Phaser.GameObjects.GameObject, source?: { target?: Phaser.GameObjects.GameObject, touchId?: number }): void {
        target.emit(type, this.createEvent(type, target, source));
        // GRoot.inst.emitter.emit(type, target);
    }
}
