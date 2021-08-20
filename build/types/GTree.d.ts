import { ByteBuffer } from './utils/ByteBuffer';
import { GObject } from './GObject';
import { GTreeNode } from './GTreeNode';
import { GList } from './GList';
import { GComponent } from './GComponent';
export declare class GTree extends GList {
    /**
     * (node: GTreeNode, obj: GComponent) => void
     */
    treeNodeRender: (node: GTreeNode, obj: GComponent) => void;
    /**
     * (node: GTreeNode, expanded: boolean) => void;
     */
    treeNodeWillExpand: (node: GTreeNode, expanded: boolean) => void;
    private _indent;
    private _clickToExpand;
    private _rootNode;
    private _expandedStatusInEvt;
    constructor();
    get rootNode(): GTreeNode;
    get indent(): number;
    set indent(value: number);
    get clickToExpand(): number;
    set clickToExpand(value: number);
    getSelectedNode(): GTreeNode;
    getSelectedNodes(result?: Array<GTreeNode>): Array<GTreeNode>;
    selectNode(node: GTreeNode, scrollItToView?: boolean): void;
    unselectNode(node: GTreeNode): void;
    expandAll(folderNode?: GTreeNode): void;
    collapseAll(folderNode?: GTreeNode): void;
    private createCell;
    private getInsertIndexForNode;
    _afterRemoved(node: GTreeNode): void;
    _afterExpanded(node: GTreeNode): void;
    _afterCollapsed(node: GTreeNode): void;
    _afterMoved(node: GTreeNode): void;
    private getFolderEndIndex;
    private checkChildren;
    private hideFolderNode;
    private removeNode;
    private __cellMouseDown;
    private __expandedStateChanged;
    protected dispatchItemEvent(item: GObject, evt: any): void;
    setup_beforeAdd(buffer: ByteBuffer, beginPos: number): void;
    protected readItems(buffer: ByteBuffer): void;
}