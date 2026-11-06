# JSONデータの概要

elements: `id,name,color,theme,primaryEffect`。
fusion_recipes: `elements:[id,id],id,name,effect`。異属性ペアを順序に関係なく一意に扱う。
enemies/bosses: `id,name,asset,patterns`。
rooms: 部屋種別と特殊条件。
obstacles: `id,asset,blocksMovement,blocksProjectiles`。
数値の調整をシステム実装から分離する。