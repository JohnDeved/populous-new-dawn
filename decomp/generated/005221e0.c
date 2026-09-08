/* Ghidra 12.1.3 pseudocode; entry 005221e0; set_render_states.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __fastcall set_render_states(int param_1)

{
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),7,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x1d,0);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x1a,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x20,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x1f,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x16,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),9,2);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),5,0);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),6,0);
  if (*(int *)(param_1 + 0x6d4) != 0) {
    (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),3,3);
  }
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),4,0);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x29,0);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x1b,1);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x15,2);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x13,5);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x14,6);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))(*(int **)(param_1 + 0x648),0x19,5);
  (**(code **)(**(int **)(param_1 + 0x648) + 0x5c))
            (*(int **)(param_1 + 0x648),0x18,*(undefined4 *)(param_1 + 0x6c4));
  return;
}
