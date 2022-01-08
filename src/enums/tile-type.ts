export enum TileMaterial {
  SOLID = 0x01,
  OBJECT = 0x02,
}

export enum TileType {
  EMPTY = 0x00,
  FLOOR = 0x01 | TileMaterial.SOLID,
  WALL = 0x02 | TileMaterial.SOLID,
  ROPE = 0x04,
  ROPE_START = 0x08,
  RIGHT_BELT = 0x10 | TileMaterial.SOLID,
  LEFT_BELT = 0x12 | TileMaterial.SOLID,
  BOMB = 0x20,
  CARROT = 0x40,
  PIPE = 0x80 | 0x01,
  PIPE_START = 0x100,
  PIPE_END = 0x110,
  TRAMPOLINE = 0x112 | TileMaterial.SOLID,
  BOMB_EXPLOSION = 0x114,
  DEAD_PARROT = 0x118,
  DEAD_PARROT_ROPE = 0x120 | 0x04,
  DEAD_FLUFFY = 0x122,
  UNKNOWN = 0x200,
  BOMB_ACTIVE = 0x210,
}
