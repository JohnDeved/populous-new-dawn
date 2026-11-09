import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { RenderView } from '../app/render-view.ts';
import { createObjectCells, setCellObject, deleteCellObject, insertObjectIntoCell, removeObjectFromCell, moveObjectInCells, cellObjectOrder, renderCellObjectOrder } from '../app/object-cells.ts';
import { createWorld, tick } from '../app/model.ts';
function person(id) { return { id, x: 256, y: 256, h: 0, flags2: 0, flags3: 0, cellNext: 0, cellPrevious: 0, displacement: { x: 0, y: 0, h: 0 } }; }
function add(w, id) { const p = person(id); setCellObject(w, id, p); insertObjectIntoCell(w, p, p); return p; }
function parity(w) { const actual = renderCellObjectOrder(w); assert.deepEqual(actual, cellObjectOrder(w)); return actual; }
test('owned ranks reuse only between supported topology changes; public maps remain independent', () => {
    const w = createObjectCells(), a = add(w, 1), b = add(w, 2), first = parity(w);
    assert.strictEqual(parity(w), first);
    const publicMap = cellObjectOrder(w);
    publicMap.clear();
    assert.equal(parity(w).size, 2);
    moveObjectInCells(w, a, { x: 257, y: 256, h: 10 });
    assert.strictEqual(parity(w), first);
    removeObjectFromCell(w, a);
    insertObjectIntoCell(w, a, a);
    assert.notStrictEqual(parity(w), first);
    const reordered = parity(w);
    assert.deepEqual([...reordered], [[1, 0], [2, 1]]);
    moveObjectInCells(w, a, { x: 768, y: 256, h: 10 });
    assert.notStrictEqual(parity(w), reordered);
    removeObjectFromCell(w, b);
    deleteCellObject(w, 2);
    parity(w);
    setCellObject(w, 1, { ...a, cellNext: 0 });
    parity(w);
    deleteCellObject(w, 1);
    assert.equal(parity(w).size, 0);
    setCellObject(w, 1, a);
    parity(w);
    assert.notStrictEqual(parity(createObjectCells()), parity(w));
});
test('unowned fixtures, clones and replaced buffers/maps remain fresh', () => {
    const w = createObjectCells();
    add(w, 1);
    parity(w);
    for (const other of [structuredClone(w), { heads: w.heads, objects: w.objects }]) {
        assert.notStrictEqual(parity(other), parity(other));
        other.objects.delete(1);
        parity(other);
    }
    for (const field of ['heads', 'objects']) {
        const cells = createObjectCells();
        add(cells, 1);
        parity(cells);
        cells[field] = field === 'heads' ? cells.heads.slice() : new Map(cells.objects);
        assert.notStrictEqual(parity(cells), parity(cells));
    }
});
test('mutation invalidates before a partial throw and failed computation is never retained', () => {
    const w = createObjectCells();
    const p = add(w, 1), first = parity(w);
    const get = w.objects.get.bind(w.objects);
    w.objects.get = () => { throw new Error('get failed'); };
    assert.throws(() => insertObjectIntoCell(w, p, p), /get failed/);
    assert.throws(() => renderCellObjectOrder(w), /get failed/);
    w.objects.get = get;
    p.cellNext = 0;
    assert.notStrictEqual(parity(w), first);
    const set = w.objects.set.bind(w.objects);
    w.objects.set = () => { throw new Error('set failed'); };
    const second = parity(w);
    assert.throws(() => setCellObject(w, 2, person(2)), /set failed/);
    w.objects.set = set;
    assert.notStrictEqual(parity(w), second);
});
test('actual unchanged Painter updates skip all 16384 head visits and retain exact outputs', () => {
    const w = createObjectCells();
    add(w, 1);
    add(w, 2);
    let visited = 0;
    const iterate = w.heads[Symbol.iterator].bind(w.heads);
    w.heads[Symbol.iterator] = function* () { for (const id of iterate()) {
        visited++;
        yield id;
    } };
    const view = new RenderView(), painter = view.painter, scene = new THREE.Scene(), renderer = { setTransparentSort() { } };
    view.update(800, 600, { x: 0, z: 0 }, 0, 0, false);
    const sprites = [];
    for (const id of [1, 2]) {
        const group = new THREE.Group(), sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true }));
        group.userData.unit = id;
        group.add(sprite);
        scene.add(group);
        view.materials.set(sprite.material, {});
        sprites.push(sprite);
    }
    scene.updateMatrixWorld(true);
    painter.cells = w;
    const snapshot = () => ({ commands: structuredClone(painter.commandsBySlot), pixels: painter.texture.image.data.slice() });
    try {
        painter.update(scene, renderer);
        const first = snapshot();
        assert.equal(visited, 16384);
        assert.equal(first.commands.filter(Boolean).length, 2);
        painter.update(scene, renderer);
        assert.equal(visited, 16384);
        assert.deepEqual(snapshot(), first);
        painter.cells = { heads: w.heads, objects: w.objects };
        painter.update(scene, renderer);
        assert.equal(visited, 32768);
        assert.deepEqual(snapshot(), first);
        painter.cells = w;
        const p = w.objects.get(1);
        removeObjectFromCell(w, p);
        insertObjectIntoCell(w, p, p);
        painter.update(scene, renderer);
        assert.equal(visited, 49152);
        const changed = snapshot();
        assert.notDeepEqual(changed.commands, first.commands);
        painter.cells = { heads: w.heads, objects: w.objects };
        painter.update(scene, renderer);
        assert.deepEqual(snapshot(), changed);
    }
    finally {
        view.dispose();
        for (const sprite of sprites)
            sprite.material.dispose();
    }
});
test('authored Mission 2 and 6 ranks match the fresh native scanner on every turn', () => {
    for (const level of [2, 6]) {
        const w = createWorld(level), baseline = structuredClone(w);
        for (let turn = 0; turn < 256; turn++) {
            parity(w.objectCells);
            tick(w, 1 / 12);
            tick(baseline, 1 / 12);
            parity(w.objectCells);
            assert.deepEqual(w, baseline);
        }
    }
});
test('a supported mutation during rank construction cannot publish a stale cache', () => {
    const w = createObjectCells();
    add(w, 1);
    const get = w.objects.get.bind(w.objects);
    let mutated = false;
    w.objects.get = id => { if (!mutated) {
        mutated = true;
        setCellObject(w, 2, person(2));
    } return get(id); };
    const first = renderCellObjectOrder(w);
    w.objects.get = get;
    assert.notStrictEqual(parity(w), first);
});
test('nested reads during mutation cannot retain intermediate ranks', () => {
    const w = createObjectCells();
    add(w, 1);
    const p = person(2);
    setCellObject(w, 2, p);
    parity(w);
    const get = w.objects.get.bind(w.objects);
    let nested, entered = false;
    w.objects.get = id => { if (!entered) {
        entered = true;
        nested = renderCellObjectOrder(w);
    } return get(id); };
    insertObjectIntoCell(w, p, p);
    w.objects.get = get;
    assert.deepEqual([...nested], [[1, 0]]);
    assert.deepEqual([...parity(w)], [[2, 0], [1, 1]]);
});
test('observed registry replacement revokes ownership even if original storage returns', () => {
    const w = createObjectCells();
    add(w, 1);
    parity(w);
    const original = w.heads;
    w.heads = original.slice();
    parity(w);
    w.heads = original;
    assert.notStrictEqual(parity(w), parity(w));
});
