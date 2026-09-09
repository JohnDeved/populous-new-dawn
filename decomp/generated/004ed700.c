/* Ghidra 12.1.3 pseudocode; entry 004ed700; maybe_unit_state_processing_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void maybe_unit_state_processing_1(int param_1)

{
  switch(*(undefined1 *)(param_1 + 0x2a)) {
  case 1:
    unit_processing_class_1_person(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 2:
    unit_processing_class_2_bldg(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 3:
    unit_processing_class_3_creature(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 4:
    unit_processing_class_4_vehicle(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 5:
    unit_processing_class_5_scenery(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 6:
    unit_processing_class_6_general(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 7:
    unit_processing_class_7_effect(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 8:
    unit_processing_class_8_shot(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 9:
    unit_processing_class_9_shape(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 10:
    unit_processing_class_10_internal(param_1);
    *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
    return;
  case 0xb:
    unit_processing_class_11_spell(param_1);
  }
  *(undefined4 *)(param_1 + 0x18) = sprite_animation_counter;
  return;
}
