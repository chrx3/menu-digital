import type { ComponentType, SVGProps } from "react";
import {
  HotdogIcon,
  FriesIcon,
  BurgerIcon,
  DrumstickIcon,
  PopcornBagIcon,
  PizzaIcon,
  TacoIcon,
  DrinkIcon,
  IceCreamIcon,
  SandwichIcon,
  StarIcon,
  HeartIcon,
  FireIcon,
  CoffeeIcon,
} from "@/app/components/icons/FoodIcons";

export type ParticleIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const BUILTIN_PARTICLE_ICON_MAP: Record<string, ParticleIconComponent> = {
  hotdog: HotdogIcon,
  fries: FriesIcon,
  burger: BurgerIcon,
  drumstick: DrumstickIcon,
  popcorn: PopcornBagIcon,
  pizza: PizzaIcon,
  taco: TacoIcon,
  drink: DrinkIcon,
  icecream: IceCreamIcon,
  sandwich: SandwichIcon,
  star: StarIcon,
  heart: HeartIcon,
  fire: FireIcon,
  coffee: CoffeeIcon,
};

export const BUILTIN_PARTICLE_ICON_NAMES = Object.keys(
  BUILTIN_PARTICLE_ICON_MAP,
);
