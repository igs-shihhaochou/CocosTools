declare namespace Tweakpane {
  //#region Tweakpane
  declare interface Config {
    blade: Blade;
    props: FolderProps;
    viewProps: ViewProps;
    expanded?: boolean;
    title?: string;
  }

  declare class ListApi<T> extends BladeApi<
    LabelController<ListController<T>>
  > {
    private readonly emitter_;
    constructor(controller: LabelController<ListController<T>>);
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    get options(): ListItem<T>[];
    set options(options: ListItem<T>[]);
    get value(): T;
    set value(value: T);
    on<EventName extends keyof ApiChangeEvents<T>>(
      eventName: EventName,
      handler: (ev: ApiChangeEvents<T>[EventName]['event']) => void
    ): this;
  }

  declare interface ListBladeParams<T> extends BaseBladeParams {
    options: ListParamsOptions<T>;
    value: T;
    view: 'list';
    label?: string;
  }

  /**
   * The root pane of Tweakpane.
   */
  declare class Pane extends RootApi {
    private readonly pool_;
    private readonly usesDefaultWrapper_;
    private doc_;
    private containerElem_;
    constructor(opt_config?: PaneConfig);
    get document(): Document;
    dispose(): void;
    registerPlugin(bundle: TpPluginBundle): void;
    private embedPluginStyle_;
    private setUpDefaultPlugins_;
  }

  declare interface PaneConfig {
    /**
     * The custom container element of the pane.
     */
    container?: HTMLElement;
    /**
     * The default expansion of the pane.
     */
    expanded?: boolean;
    /**
     * The pane title that can expand/collapse the entire pane.
     */
    title?: string;
    /**
     * @hidden
     */
    document?: Document;
  }

  declare interface PresetObject {
    [key: string]: unknown;
  }

  declare class RootApi extends FolderApi {
    /**
     * @hidden
     */
    constructor(controller: RootController, pool: PluginPool);
    get element(): HTMLElement;
    /**
     * Imports a preset of all inputs.
     * @param preset The preset object to import.
     */
    importPreset(preset: PresetObject): void;
    /**
     * Exports a preset of all inputs.
     * @return An exported preset object.
     */
    exportPreset(): PresetObject;
    /**
     * Refreshes all bindings of the pane.
     */
    refresh(): void;
  }

  declare class RootController extends FolderController {
    constructor(doc: Document, config: Config);
  }

  /***
   * A simple semantic versioning perser.
   */
  declare class Semver {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly prerelease: string | null;
    /**
     * @hidden
     */
    constructor(text: string);
    toString(): string;
  }

  declare class SliderApi extends BladeApi<
    LabeledValueController<number, SliderTextController>
  > {
    private readonly emitter_;
    constructor(
      controller: LabeledValueController<number, SliderTextController>
    );
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    get maxValue(): number;
    set maxValue(maxValue: number);
    get minValue(): number;
    set minValue(minValue: number);
    get value(): number;
    set value(value: number);
    on<EventName extends keyof ApiChangeEvents<number>>(
      eventName: EventName,
      handler: (ev: ApiChangeEvents<number>[EventName]['event']) => void
    ): this;
  }

  declare interface SliderBladeParams extends BaseBladeParams {
    max: number;
    min: number;
    view: 'slider';
    format?: Formatter<number>;
    label?: string;
    value?: number;
  }

  declare class TextApi<T> extends BladeApi<
    LabelController<TextController<T>>
  > {
    private readonly emitter_;
    constructor(controller: LabelController<TextController<T>>);
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    get formatter(): Formatter<T>;
    set formatter(formatter: Formatter<T>);
    get value(): T;
    set value(value: T);
    on<EventName extends keyof ApiChangeEvents<T>>(
      eventName: EventName,
      handler: (ev: ApiChangeEvents<T>[EventName]['event']) => void
    ): this;
  }

  declare interface TextBladeParams<T> extends BaseBladeParams {
    parse: Parser<T>;
    value: T;
    view: 'text';
    format?: Formatter<T>;
    label?: string;
  }

  declare const VERSION: Semver;
  //#endregion

  //#region Tweakpane Core
  declare interface Acceptance<P extends BaseBladeParams> {
    params: Omit<P, 'disabled' | 'hidden'>;
  }

  declare interface Acceptance_2<T, P extends BaseInputParams> {
    initialValue: T;
    params: P;
  }

  declare interface Acceptance_3<T, P extends BaseMonitorParams> {
    initialValue: T;
    params: P;
  }

  declare interface ApiArguments {
    controller: BladeController<View>;
    pool: PluginPool;
  }

  declare interface ApiChangeEvents<T> {
    change: {
      event: TpChangeEvent<T>;
    };
  }

  declare type ArrayStyleListOptions<T> = {
    text: string;
    value: T;
  }[];

  declare interface Axis {
    baseStep: number;
    constraint: Constraint<number> | undefined;
    textProps: NumberTextProps;
  }

  declare interface Axis_2 {
    baseStep: number;
    constraint: Constraint<number> | undefined;
    textProps: NumberTextProps;
  }

  declare interface BaseBladeParams
    extends BaseParams,
      Record<string, unknown> {}

  declare interface BaseInputParams
    extends BaseParams,
      Record<string, unknown> {
    label?: string;
    presetKey?: string;
    view?: string;
  }

  declare interface BaseMonitorParams
    extends BaseParams,
      Record<string, unknown> {
    bufferSize?: number;
    interval?: number;
    label?: string;
    view?: string;
  }

  declare interface BaseParams {
    disabled?: boolean;
    hidden?: boolean;
    index?: number;
  }

  /**
   * A base interface of the plugin.
   */
  declare interface BasePlugin {
    /**
     * The identifier of the plugin.
     */
    id: string;
    /**
     * The type of the plugin.
     */
    type: PluginType;
    /**
     * The custom CSS for the plugin.
     */
    css?: string;
  }

  declare type Bindable = Record<string, any>;

  declare function bindFoldable(foldable: Foldable, elem: HTMLElement): void;

  declare interface BindingArguments<Ex, P extends BaseInputParams> {
    initialValue: Ex;
    params: P;
    target: BindingTarget;
  }

  declare interface BindingArguments_2<T, P extends BaseMonitorParams> {
    initialValue: T;
    params: P;
    target: BindingTarget;
  }

  /**
   * Converts an external unknown value into the internal value.
   * @template In The type of the internal value.
   */
  declare interface BindingReader<In> {
    /**
     * @param exValue The bound value.
     * @return A converted value.
     */
    (exValue: unknown): In;
  }

  /**
   * A binding target.
   */
  declare class BindingTarget {
    private readonly key_;
    private readonly obj_;
    private readonly presetKey_;
    constructor(obj: Bindable, key: string, opt_id?: string);
    static isBindable(obj: unknown): obj is Bindable;
    /**
     * The property name of the binding.
     */
    get key(): string;
    /**
     * The key used for presets.
     */
    get presetKey(): string;
    /**
     * Read a bound value.
     * @return A bound value
     */
    read(): unknown;
    /**
     * Write a value.
     * @param value The value to write to the target.
     */
    write(value: unknown): void;
    /**
     * Write a value to the target property.
     * @param name The property name.
     * @param value The value to write to the target.
     */
    writeProperty(name: string, value: unknown): void;
  }

  /**
   * Writes the internal value to the bound target.
   * @template In The type of the internal value.
   */
  declare interface BindingWriter<In> {
    /**
     * @param target The target to be written.
     * @param inValue The value to write.
     */
    (target: BindingTarget, inValue: In): void;
  }

  declare function bindValue<T>(
    value: Value<T> | ReadonlyValue<T>,
    applyValue: (value: T) => void
  ): void;

  declare function bindValueMap<
    O extends Record<string, unknown>,
    Key extends keyof O,
  >(valueMap: ValueMap<O>, key: Key, applyValue: (value: O[Key]) => void): void;

  declare function bindValueToTextContent(
    value: Value<string | undefined>,
    elem: HTMLElement
  ): void;

  declare type Blade = ValueMap<{
    positions: BladePosition[];
  }>;

  declare class BladeApi<C extends BladeController<View>> {
    /**
     * @hidden
     */
    readonly controller_: C;
    /**
     * @hidden
     */
    constructor(controller: C);
    get element(): HTMLElement;
    get disabled(): boolean;
    set disabled(disabled: boolean);
    get hidden(): boolean;
    set hidden(hidden: boolean);
    dispose(): void;
  }

  declare class BladeController<V extends View> implements Controller<V> {
    readonly blade: Blade;
    readonly view: V;
    readonly viewProps: ViewProps;
    private parent_;
    constructor(config: Config_2<V>);
    get parent(): BladeRack | null;
    set parent(parent: BladeRack | null);
  }

  declare interface BladePlugin<P extends BaseBladeParams> extends BasePlugin {
    type: 'blade';
    accept: {
      (params: Record<string, unknown>): Acceptance<P> | null;
    };
    controller: {
      (args: ControllerArguments<P>): BladeController<View>;
    };
    api: {
      (args: ApiArguments): BladeApi<BladeController<View>> | null;
    };
  }

  declare type BladePosition = 'veryfirst' | 'first' | 'last' | 'verylast';

  /**
   * A collection of blade controllers that manages positions and event propagation.
   */
  declare class BladeRack {
    readonly emitter: Emitter<BladeRackEvents>;
    readonly viewProps: ViewProps;
    private readonly blade_;
    private readonly bcSet_;
    constructor(config: Config_3);
    get children(): BladeController<View>[];
    add(bc: BladeController<View>, opt_index?: number): void;
    remove(bc: BladeController<View>): void;
    find<B extends BladeController<View>>(controllerClass: Class<B>): B[];
    private onSetAdd_;
    private onSetRemove_;
    private updatePositions_;
    private onChildPositionsChange_;
    private onChildViewPropsChange_;
    private onChildDispose_;
    private onChildInputChange_;
    private onChildMonitorUpdate_;
    private onChildValueChange_;
    private onDescendantLayout_;
    private onDescendantInputChange_;
    private onDescendantMonitorUpdate_;
    private onBladePositionsChange_;
  }

  declare interface BladeRackApi {
    /**
     * Children of the container.
     */
    readonly children: BladeApi<BladeController<View>>[];
    addButton(params: ButtonParams): ButtonApi;
    addFolder(params: FolderParams): FolderApi;
    addSeparator(opt_params?: SeparatorParams): SeparatorApi;
    addTab(params: TabParams): TabApi;
    add(api: BladeApi<BladeController<View>>, opt_index?: number): void;
    remove(api: BladeApi<BladeController<View>>): void;
    /**
     * Creates a new input binding and add it to the container.
     * @param object The binding target.
     * @param key The key of the target property.
     * @param opt_params The options of a binding.
     * @return The API object.
     */
    addInput<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: InputParams
    ): InputBindingApi<unknown, O[Key]>;
    /**
     * Creates a new monitor binding and add it to the container.
     * @param object The binding target.
     * @param key The key of the target property.
     * @param opt_params The options of a binding.
     * @return The API object.
     */
    addMonitor<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: MonitorParams
    ): MonitorBindingApi<O[Key]>;
    /**
     * Creates a new blade and add it to the container.
     * @param params The options for a blade.
     */
    addBlade(params: BaseBladeParams): BladeApi<BladeController<View>>;
  }

  declare interface BladeRackApiEvents {
    change: {
      event: TpChangeEvent<unknown>;
    };
    update: {
      event: TpUpdateEvent<unknown>;
    };
  }

  /**
   * @hidden
   */
  declare interface BladeRackEvents {
    add: {
      bladeController: BladeController<View>;
      index: number;
      isRoot: boolean;
      sender: BladeRack;
    };
    remove: {
      bladeController: BladeController<View>;
      isRoot: boolean;
      sender: BladeRack;
    };
    inputchange: {
      bladeController: BladeController<View>;
      options: ValueChangeOptions;
      sender: BladeRack;
    };
    layout: {
      sender: BladeRack;
    };
    monitorupdate: {
      bladeController: BladeController<View>;
      sender: BladeRack;
    };
  }

  /**
   * @hidden
   */
  declare function BooleanFormatter(value: boolean): string;

  declare interface BooleanInputParams extends BaseInputParams {
    options?: ListParamsOptions<boolean>;
  }

  /**
   * @hidden
   */
  declare const BooleanInputPlugin: InputBindingPlugin<
    boolean,
    boolean,
    BooleanInputParams
  >;

  declare interface BooleanMonitorParams extends BaseMonitorParams {
    lineCount?: number;
  }

  /**
   * @hidden
   */
  declare const BooleanMonitorPlugin: MonitorBindingPlugin<
    boolean,
    BooleanMonitorParams
  >;

  /**
   * @hidden
   */
  declare function boolFromUnknown(value: unknown): boolean;

  /**
   * @hidden
   */
  declare function boolToString(value: boolean): string;

  /**
   * @hidden
   */
  declare type Buffer<T> = (T | undefined)[];

  /**
   * @hidden
   */
  declare type BufferedValue<T> = Value<Buffer<T>>;

  declare class ButtonApi extends BladeApi<LabelController<ButtonController>> {
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    get title(): string;
    set title(title: string);
    on<EventName extends keyof ButtonApiEvents>(
      eventName: EventName,
      handler: (ev: ButtonApiEvents[EventName]['event']) => void
    ): ButtonApi;
  }

  declare interface ButtonApiEvents {
    click: {
      event: TpEvent;
    };
  }

  declare interface ButtonBladeParams extends BaseBladeParams {
    title: string;
    view: 'button';
    label?: string;
  }

  declare const ButtonBladePlugin: BladePlugin<ButtonBladeParams>;

  /**
   * @hidden
   */
  declare class ButtonController implements Controller<ButtonView> {
    readonly emitter: Emitter<ButtonEvents>;
    readonly props: ButtonProps;
    readonly view: ButtonView;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_11);
    private onClick_;
  }

  /**
   * @hidden
   */
  declare interface ButtonEvents {
    click: {
      sender: ButtonController;
    };
  }

  declare interface ButtonParams extends BaseParams {
    title: string;
    label?: string;
  }

  declare type ButtonProps = ValueMap<ButtonPropsObject>;

  declare type ButtonPropsObject = {
    title: string | undefined;
  };

  /**
   * @hidden
   */
  declare class ButtonView implements View {
    readonly element: HTMLElement;
    readonly buttonElement: HTMLButtonElement;
    constructor(doc: Document, config: Config_10);
  }

  /**
   * @hidden
   */
  declare class CheckboxController
    implements ValueController<boolean, CheckboxView>
  {
    readonly value: Value<boolean>;
    readonly view: CheckboxView;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_41);
    private onInputChange_;
  }

  /**
   * @hidden
   */
  declare class CheckboxView implements View {
    readonly element: HTMLElement;
    readonly inputElement: HTMLInputElement;
    readonly value: Value<boolean>;
    constructor(doc: Document, config: Config_40);
    private update_;
    private onValueChange_;
  }

  declare type Class<T> = new (...args: any[]) => T;

  /**
   * A utility function for generating BEM-like class name.
   * @param viewName The name of the view. Used as part of the block name.
   * @return A class name generator function.
   */
  declare function ClassName(
    viewName: string
  ): (opt_elementName?: string, opt_modifier?: string) => string;

  /**
   * @hidden
   */
  declare class Color {
    static black(type?: ColorType): Color;
    static fromObject(
      obj: RgbColorObject | RgbaColorObject,
      type?: ColorType
    ): Color;
    static toRgbaObject(color: Color, type?: ColorType): RgbaColorObject;
    static isRgbColorObject(obj: unknown): obj is RgbColorObject;
    static isRgbaColorObject(obj: unknown): obj is RgbaColorObject;
    static isColorObject(obj: unknown): obj is RgbColorObject | RgbaColorObject;
    static equals(v1: Color, v2: Color): boolean;
    private readonly comps_;
    readonly mode: ColorMode;
    readonly type: ColorType;
    constructor(
      comps: ColorComponents3 | ColorComponents4,
      mode: ColorMode,
      type?: ColorType
    );
    getComponents(opt_mode?: ColorMode, type?: ColorType): ColorComponents4;
    toRgbaObject(type?: ColorType): RgbaColorObject;
  }

  declare type ColorComponents3 = Tuple3<number>;

  declare type ColorComponents4 = Tuple4<number>;

  /**
   * @hidden
   */
  declare class ColorController implements Controller<ColorView> {
    readonly value: Value<Color>;
    readonly view: ColorView;
    readonly viewProps: ViewProps;
    private readonly swatchC_;
    private readonly textC_;
    private readonly pickerC_;
    private readonly popC_;
    private readonly foldable_;
    constructor(doc: Document, config: Config_43);
    get textController(): TextController<Color>;
    private onButtonBlur_;
    private onButtonClick_;
    private onPopupChildBlur_;
    private onPopupChildKeydown_;
  }

  /**
   * @hidden
   */
  declare function colorFromObject(value: unknown, opt_type?: ColorType): Color;

  /**
   * @hidden
   */
  declare function colorFromRgbaNumber(value: unknown): Color;

  /**
   * @hidden
   */
  declare function colorFromRgbNumber(value: unknown): Color;

  /**
   * @deprecated
   * @hidden
   */
  declare function colorFromString(value: unknown): Color;

  declare interface ColorInputParams extends BaseInputParams {
    /**
     * @deprecated Use color.alpha instead.
     */
    alpha?: boolean;
    color?: {
      alpha?: boolean;
      type?: ColorType;
    };
    expanded?: boolean;
    picker?: PickerLayout;
  }

  declare type ColorMode = 'hsl' | 'hsv' | 'rgb';

  /**
   * @hidden
   */
  declare function colorToFunctionalHslaString(value: Color): string;

  /**
   * @hidden
   */
  declare function colorToFunctionalHslString(value: Color): string;

  /**
   * @hidden
   */
  declare function colorToFunctionalRgbaString(
    value: Color,
    opt_type?: ColorType
  ): string;

  /**
   * @hidden
   */
  declare function colorToFunctionalRgbString(
    value: Color,
    opt_type?: ColorType
  ): string;

  /**
   * @hidden
   */
  declare function colorToHexRgbaString(value: Color, prefix?: string): string;

  /**
   * @hidden
   */
  declare function colorToHexRgbString(value: Color, prefix?: string): string;

  /**
   * @hidden
   */
  declare function colorToObjectRgbaString(
    value: Color,
    type: ColorType
  ): string;

  /**
   * @hidden
   */
  declare function colorToObjectRgbString(
    value: Color,
    type: ColorType
  ): string;

  /**
   * @hidden
   */
  declare function colorToRgbaNumber(value: Color): number;

  /**
   * @hidden
   */
  declare function colorToRgbNumber(value: Color): number;

  declare type ColorType = 'float' | 'int';

  /**
   * @hidden
   */
  declare class ColorView implements View {
    readonly element: HTMLElement;
    readonly swatchElement: HTMLElement;
    readonly textElement: HTMLElement;
    readonly pickerElement: HTMLElement | null;
    constructor(doc: Document, config: Config_42);
  }

  /**
   * @deprecated Use createColorStringParser instead.
   * @hidden
   */
  declare const CompositeColorParser: Parser<Color>;

  /**
   * A constraint to combine multiple constraints.
   * @template T The type of the value.
   */
  declare class CompositeConstraint<T> implements Constraint<T> {
    readonly constraints: Constraint<T>[];
    constructor(constraints: Constraint<T>[]);
    constrain(value: T): T;
  }

  /**
   * @hidden
   */
  declare interface Config<T> {
    props: TextProps<T>;
    parser: Parser<T>;
    value: Value<T>;
    viewProps: ViewProps;
  }

  declare interface Config_10 {
    props: ButtonProps;
    viewProps: ViewProps;
  }

  declare interface Config_11 {
    props: ButtonProps;
    viewProps: ViewProps;
  }

  declare interface Config_12<T, V extends View> {
    blade: Blade;
    value: Value<T>;
    view: V;
    viewProps: ViewProps;
  }

  declare interface Config_13 {
    viewName: string;
    viewProps: ViewProps;
  }

  declare interface Config_14 {
    blade: Blade;
    viewProps: ViewProps;
    root?: boolean;
  }

  declare interface Config_15 {
    viewProps: ViewProps;
  }

  declare interface Config_16 {
    blade: Blade;
    viewProps: ViewProps;
  }

  declare interface Config_17<V extends View> {
    blade: Blade;
    rackController: RackController;
    view: V;
  }

  declare interface Config_18 {
    contentsElement: HTMLElement;
    empty: Value<boolean>;
    viewProps: ViewProps;
  }

  declare interface Config_19 {
    blade: Blade;
    viewProps: ViewProps;
  }

  declare interface Config_2<V extends View> {
    blade: Blade;
    view: V;
    viewProps: ViewProps;
  }

  declare interface Config_20 {
    itemProps: TabItemProps;
    props: TabPageProps;
  }

  declare interface Config_21 {
    props: TabItemProps;
    viewProps: ViewProps;
  }

  declare interface Config_22 {
    props: TabItemProps;
    viewProps: ViewProps;
  }

  declare interface Config_23 {
    containerElement: HTMLElement;
    foldable: Foldable;
    props: FolderProps;
    viewProps: ViewProps;
    viewName?: string;
  }

  declare interface Config_24 {
    expanded?: boolean;
    blade: Blade;
    props: FolderProps;
    viewProps: ViewProps;
    root?: boolean;
  }

  declare interface Config_25<T, C extends ValueController<T, View>> {
    blade: Blade;
    props: LabelProps;
    valueController: C;
  }

  declare interface Config_26 {
    max: number;
    min: number;
  }

  declare interface Config_27 {
    max?: number;
    min?: number;
  }

  declare interface Config_28<T> {
    props: ListProps<T>;
    value: Value<T>;
    viewProps: ViewProps;
  }

  declare interface Config_29<T> {
    props: ListProps<T>;
    value: Value<T>;
    viewProps: ViewProps;
  }

  declare interface Config_3 {
    blade?: Blade;
    viewProps: ViewProps;
  }

  declare interface Config_30 {
    shows: Value<boolean>;
    viewProps: ViewProps;
  }

  declare interface Config_31 {
    viewProps: ViewProps;
  }

  declare interface Config_32<T> {
    props: TextProps<T>;
    value: Value<T>;
    viewProps: ViewProps;
  }

  declare interface Config_33<T> {
    constraint?: Constraint<T>;
    equals?: (v1: T, v2: T) => boolean;
  }

  declare interface Config_34 {
    baseStep: number;
    parser: Parser<number>;
    props: NumberTextProps;
    sliderProps?: SliderProps;
    value: Value<number>;
    viewProps: ViewProps;
    arrayPosition?: 'fst' | 'mid' | 'lst';
  }

  declare interface Config_35 {
    props: SliderProps;
    value: Value<number>;
    viewProps: ViewProps;
  }

  declare interface Config_36 {
    baseStep: number;
    props: SliderProps;
    value: Value<number>;
    viewProps: ViewProps;
  }

  declare interface Config_37 {
    sliderView: SliderView;
    textView: NumberTextView;
  }

  declare interface Config_38 {
    baseStep: number;
    parser: Parser<number>;
    sliderProps: SliderProps;
    textProps: NumberTextProps;
    value: Value<number>;
    viewProps: ViewProps;
  }

  declare interface Config_39<T extends ErrorType> {
    context?: ErrorContext[T];
    type: T;
  }

  declare interface Config_4 {
    props: LabelProps;
    viewProps: ViewProps;
  }

  declare interface Config_40 {
    value: Value<boolean>;
    viewProps: ViewProps;
  }

  /**
   * @hidden
   */
  declare interface Config_41 {
    value: Value<boolean>;
    viewProps: ViewProps;
  }

  declare interface Config_42 {
    foldable: Foldable;
    pickerLayout: PickerLayout;
  }

  declare interface Config_43 {
    colorType: ColorType;
    expanded: boolean;
    formatter: Formatter<Color>;
    parser: Parser<Color>;
    pickerLayout: PickerLayout;
    supportsAlpha: boolean;
    value: Value<Color>;
    viewProps: ViewProps;
  }

  declare interface Config_44<PointNd> {
    assembly: PointNdAssembly<PointNd>;
    components: (Constraint<number> | undefined)[];
  }

  declare interface Config_45 {
    textViews: NumberTextView[];
  }

  declare interface Config_46<PointNd> {
    assembly: PointNdAssembly<PointNd>;
    axes: Axis[];
    parser: Parser<number>;
    value: Value<PointNd>;
    viewProps: ViewProps;
  }

  declare interface Config_47 {
    expanded: Value<boolean>;
    pickerLayout: PickerLayout;
    viewProps: ViewProps;
  }

  declare interface Config_48 {
    axes: [Axis_2, Axis_2];
    expanded: boolean;
    invertsY: boolean;
    maxValue: number;
    parser: Parser<number>;
    pickerLayout: PickerLayout;
    value: Value<Point2d>;
    viewProps: ViewProps;
  }

  declare interface Config_49<T> {
    formatter: Formatter<T>;
    lineCount: number;
    value: BufferedValue<T>;
    viewProps: ViewProps;
  }

  declare interface Config_5<C extends Controller<View>> {
    blade: Blade;
    props: LabelProps;
    valueController: C;
  }

  declare interface Config_50<T> {
    formatter: Formatter<T>;
    lineCount: number;
    value: BufferedValue<T>;
    viewProps: ViewProps;
  }

  declare interface Config_51<T> {
    formatter: Formatter<T>;
    value: BufferedValue<T>;
    viewProps: ViewProps;
  }

  declare interface Config_52<T> {
    formatter: Formatter<T>;
    value: BufferedValue<T>;
    viewProps: ViewProps;
  }

  declare interface Config_53 {
    cursor: Value<number>;
    formatter: Formatter<number>;
    lineCount: number;
    props: GraphLogProps;
    value: BufferedValue<number>;
    viewProps: ViewProps;
  }

  declare interface Config_54 {
    formatter: Formatter<number>;
    lineCount: number;
    props: GraphLogProps;
    value: BufferedValue<number>;
    viewProps: ViewProps;
  }

  declare interface Config_6<In> {
    reader: BindingReader<In>;
    target: BindingTarget;
    value: Value<In>;
    writer: BindingWriter<In>;
  }

  declare interface Config_7<In> {
    binding: InputBinding<In>;
    blade: Blade;
    props: LabelProps;
    valueController: Controller<View>;
  }

  declare interface Config_8<T> {
    reader: BindingReader<T>;
    target: BindingTarget;
    ticker: Ticker;
    value: BufferedValue<T>;
  }

  declare interface Config_9<T> {
    binding: MonitorBinding<T>;
    blade: Blade;
    props: LabelProps;
    valueController: Controller<View>;
  }

  /**
   * Synchronizes two values.
   */
  declare function connectValues<T1, T2>({
    primary,
    secondary,
    forward,
    backward,
  }: {
    primary: Value<T1>;
    secondary: Value<T2>;
    forward: (primary: Value<T1>, secondary: Value<T2>) => T2;
    backward: (primary: Value<T1>, secondary: Value<T2>) => T1;
  }): void;

  declare const Constants: {
    monitor: {
      defaultInterval: number;
      defaultLineCount: number;
    };
  };

  declare function constrainRange(
    value: number,
    min: number,
    max: number
  ): number;

  /**
   * A constraint for the value.
   * @template T The type of the value.
   */
  declare interface Constraint<T> {
    /**
     * Constrains the value.
     * @param value The value.
     * @return A constarined value.
     */
    constrain(value: T): T;
  }

  /**
   * A controller that has a view to control.
   */
  declare interface Controller<V extends View> {
    readonly view: V;
    readonly viewProps: ViewProps;
  }

  declare interface ControllerArguments<P extends BaseBladeParams> {
    blade: Blade;
    document: Document;
    params: P;
    viewProps: ViewProps;
  }

  declare interface ControllerArguments_2<In, Ex, P extends BaseInputParams> {
    constraint: Constraint<In> | undefined;
    document: Document;
    initialValue: Ex;
    params: P;
    value: Value<In>;
    viewProps: ViewProps;
  }

  declare interface ControllerArguments_3<T, P extends BaseMonitorParams> {
    document: Document;
    params: P;
    value: BufferedValue<T>;
    viewProps: ViewProps;
  }

  declare function createBlade(): Blade;

  declare function createBladeController<P extends BaseBladeParams>(
    plugin: BladePlugin<P>,
    args: {
      document: Document;
      params: Record<string, unknown>;
    }
  ): BladeController<View> | null;

  declare function createColorStringBindingReader(
    type: ColorType
  ): BindingReader<Color>;

  declare function createColorStringParser(type: ColorType): Parser<Color>;

  declare function createDefaultPluginPool(): PluginPool;

  declare function createDimensionConstraint(
    params: PointDimensionParams | undefined,
    initialValue: number
  ): Constraint<number> | undefined;

  /**
   * @deprecated Use Foldable.create instead.
   */
  declare function createFoldable(expanded: boolean): Foldable;

  /**
   * Tries to create a list constraint.
   * @template T The type of the raw value.
   * @param options The list options.
   * @return A constraint or null if not found.
   */
  declare function createListConstraint<T>(
    options: ListParamsOptions<T> | undefined
  ): ListConstraint<T> | null;

  /**
   * @hidden
   */
  declare function createNumberFormatter(digits: number): Formatter<number>;

  /**
   * @hidden
   */
  declare function createPushedBuffer<T>(
    buffer: Buffer<T>,
    newValue: T
  ): Buffer<T>;

  /**
   * Tries to create a range constraint.
   * @param params The input parameters object.
   * @return A constraint or null if not found.
   */
  declare function createRangeConstraint(params: {
    max?: number;
    min?: number;
  }): Constraint<number> | null;

  /**
   * Tries to create a step constraint.
   * @param params The input parameters object.
   * @return A constraint or null if not found.
   */
  declare function createStepConstraint(
    params: {
      step?: number;
    },
    initialValue?: number
  ): Constraint<number> | null;

  declare function createSvgIconElement(
    document: Document,
    iconId: IconId
  ): Element;

  declare function createValue<T>(
    initialValue: T,
    config?: Config_33<T>
  ): Value<T>;

  declare function deepEqualsArray<T>(a1: T[], a2: T[]): boolean;

  /**
   * A number range constraint that cannot be undefined. Used for slider control.
   */
  declare class DefiniteRangeConstraint implements Constraint<number> {
    readonly values: ValueMap<{
      max: number;
      min: number;
    }>;
    constructor(config: Config_26);
    constrain(value: number): number;
  }

  declare function detectStringColorFormat(
    text: string,
    type?: ColorType
  ): StringColorFormat | null;

  declare interface Disableable {
    disabled: boolean;
  }

  declare function disableTransitionTemporarily(
    element: HTMLElement,
    callback: () => void
  ): void;

  /**
   * A type-safe event emitter.
   * @template E The interface that maps event names and event objects.
   */
  declare class Emitter<E> {
    private readonly observers_;
    constructor();
    /**
     * Adds an event listener to the emitter.
     * @param eventName The event name to listen.
     * @param handler The event handler.
     */
    on<EventName extends keyof E>(
      eventName: EventName,
      handler: Handler<E[EventName]>
    ): Emitter<E>;
    /**
     * Removes an event listener from the emitter.
     * @param eventName The event name.
     * @param handler The event handler to remove.
     */
    off<EventName extends keyof E>(
      eventName: EventName,
      handler: Handler<E[EventName]>
    ): Emitter<E>;
    emit<EventName extends keyof E>(
      eventName: EventName,
      event: E[EventName]
    ): void;
  }

  declare interface ErrorContext {
    alreadydisposed: undefined;
    invalidparams: {
      name: string;
    };
    nomatchingcontroller: {
      key: string;
    };
    nomatchingview: {
      params: Record<string, unknown>;
    };
    notbindable: undefined;
    propertynotfound: {
      name: string;
    };
    shouldneverhappen: undefined;
  }

  declare type ErrorType = keyof ErrorContext;

  declare type Extractor<T> = (item: T) => NestedOrderedSet<T> | null;

  declare function findColorStringifier(
    format: StringColorFormat
  ): Formatter<Color> | null;

  declare function findConstraint<C>(
    c: Constraint<unknown>,
    constraintClass: Class<C>
  ): C | null;

  declare function findNextTarget(ev: FocusEvent): HTMLElement | null;

  /**
   * Finds a range from number constraint.
   * @param c The number constraint.
   * @return A list that contains a minimum value and a max value.
   */
  declare function findNumberRange(
    c: Constraint<number>
  ): [number | undefined, number | undefined];

  /**
   * @hidden
   */
  declare class Foldable extends ValueMap<FoldableObject> {
    constructor(valueMap: {
      [Key in keyof FoldableObject]: Value<FoldableObject[Key]>;
    });
    static create(expanded: boolean): Foldable;
    get styleExpanded(): boolean;
    get styleHeight(): string;
    bindExpandedClass(elem: HTMLElement, expandedClassName: string): void;
    cleanUpTransition(): void;
  }

  declare type FoldableObject = {
    completed: boolean;
    expanded: boolean;
    expandedHeight: number | null;
    shouldFixHeight: boolean;
    temporaryExpanded: boolean | null;
  };

  declare class FolderApi
    extends RackLikeApi<FolderController>
    implements BladeRackApi
  {
    private readonly emitter_;
    /**
     * @hidden
     */
    constructor(controller: FolderController, pool: PluginPool);
    get expanded(): boolean;
    set expanded(expanded: boolean);
    get title(): string | undefined;
    set title(title: string | undefined);
    get children(): BladeApi<BladeController<View>>[];
    addInput<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: InputParams
    ): InputBindingApi<unknown, O[Key]>;
    addMonitor<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: MonitorParams
    ): MonitorBindingApi<O[Key]>;
    addFolder(params: FolderParams): FolderApi;
    addButton(params: ButtonParams): ButtonApi;
    addSeparator(opt_params?: SeparatorParams): SeparatorApi;
    addTab(params: TabParams): TabApi;
    add<A extends BladeApi<BladeController<View>>>(
      api: A,
      opt_index?: number
    ): A;
    remove(api: BladeApi<BladeController<View>>): void;
    addBlade(params: BaseBladeParams): BladeApi<BladeController<View>>;
    /**
     * Adds a global event listener. It handles all events of child inputs/monitors.
     * @param eventName The event name to listen.
     * @return The API object itself.
     */
    on<EventName extends keyof FolderApiEvents>(
      eventName: EventName,
      handler: (ev: FolderApiEvents[EventName]['event']) => void
    ): FolderApi;
  }

  declare interface FolderApiEvents {
    change: {
      event: TpChangeEvent<unknown>;
    };
    fold: {
      event: TpFoldEvent;
    };
    update: {
      event: TpUpdateEvent<unknown>;
    };
  }

  declare interface FolderBladeParams extends BaseBladeParams {
    title: string;
    view: 'folder';
    expanded?: boolean;
  }

  declare const FolderBladePlugin: BladePlugin<FolderBladeParams>;

  /**
   * @hidden
   */
  declare class FolderController extends RackLikeController<FolderView> {
    readonly foldable: Foldable;
    readonly props: FolderProps;
    constructor(doc: Document, config: Config_24);
    get document(): Document;
    private onTitleClick_;
  }

  declare interface FolderParams extends BaseParams {
    title: string;
    expanded?: boolean;
  }

  declare type FolderProps = ValueMap<FolderPropsObject>;

  declare type FolderPropsObject = {
    title: string | undefined;
  };

  /**
   * @hidden
   */
  declare class FolderView implements View {
    readonly buttonElement: HTMLButtonElement;
    readonly containerElement: HTMLElement;
    readonly titleElement: HTMLElement;
    readonly element: HTMLElement;
    private readonly foldable_;
    private readonly className_;
    constructor(doc: Document, config: Config_23);
  }

  declare function forceCast<T>(v: any): T;

  declare function forceReflow(element: HTMLElement): void;

  /**
   * @hidden
   */
  declare function formatPercentage(value: number): string;

  /**
   * @hidden
   */
  declare function formatString(value: string): string;

  declare type Formatter<T> = (value: T) => string;

  declare function getAllBladePositions(): BladePosition[];

  /**
   * @hidden
   */
  declare function getBaseStep(
    constraint: Constraint<number> | undefined
  ): number;

  declare function getCanvasContext(
    canvasElement: HTMLCanvasElement
  ): CanvasRenderingContext2D | null;

  /**
   * @deprecated
   * @hidden
   */
  declare function getColorNotation(text: string): StringColorNotation | null;

  /**
   * @deprecated
   */
  declare function getColorStringifier(
    notation: StringColorNotation
  ): (value: Color) => string;

  declare function getDecimalDigits(value: number): number;

  /**
   * @deprecated Use foldable.styleExpanded instead.
   */
  declare function getFoldableStyleExpanded(foldable: Foldable): boolean;

  /**
   * @deprecated Use foldable.styleHeight instead.
   */
  declare function getFoldableStyleHeight(foldable: Foldable): string;

  /**
   * @hidden
   */
  declare function getHorizontalStepKeys(ev: KeyboardEvent): StepKeys;

  /**
   * @hidden
   */
  declare function getStepForKey(baseStep: number, keys: StepKeys): number;

  /**
   * @hidden
   */
  declare function getSuitableDecimalDigits(
    constraint: Constraint<number> | undefined,
    rawValue: number
  ): number;

  /**
   * @hidden
   */
  declare function getSuitableDraggingScale(
    constraint: Constraint<number> | undefined,
    rawValue: number
  ): number;

  /**
   * @hidden
   */
  declare function getSuitableMaxValue(
    initialValue: Point2d,
    constraint: Constraint<Point2d> | undefined
  ): number;

  /**
   * @hidden
   */
  declare function getVerticalStepKeys(ev: KeyboardEvent): StepKeys;

  declare function getWindowDocument(): Document;

  /**
   * @hidden
   */
  declare class GraphLogController implements Controller<GraphLogView> {
    readonly value: BufferedValue<number>;
    readonly view: GraphLogView;
    readonly viewProps: ViewProps;
    private readonly cursor_;
    private readonly props_;
    constructor(doc: Document, config: Config_54);
    private onGraphMouseLeave_;
    private onGraphMouseMove_;
    private onGraphPointerDown_;
    private onGraphPointerMove_;
    private onGraphPointerUp_;
  }

  declare type GraphLogProps = ValueMap<{
    maxValue: number;
    minValue: number;
  }>;

  /**
   * @hidden
   */
  declare class GraphLogView implements View {
    readonly element: HTMLElement;
    readonly value: BufferedValue<number>;
    private readonly props_;
    private readonly cursor_;
    private readonly formatter_;
    private readonly lineElem_;
    private readonly svgElem_;
    private readonly tooltipElem_;
    constructor(doc: Document, config: Config_53);
    get graphElement(): Element;
    private update_;
    private onValueUpdate_;
    private onCursorChange_;
  }

  declare type Handler<E> = (ev: E) => void;

  /**
   * @deprecated
   * @hidden
   */
  declare function hasAlphaComponent(notation: StringColorNotation): boolean;

  declare const ICON_ID_TO_INNER_HTML_MAP: {
    [key in string]: string;
  };

  declare type IconId = keyof typeof ICON_ID_TO_INNER_HTML_MAP;

  declare function indexOfChildElement(element: Element): number;

  /**
   * @hidden
   */
  declare function initializeBuffer<T>(bufferSize: number): BufferedValue<T>;

  /**
   * @hidden
   */
  declare class InputBinding<In> {
    readonly emitter: Emitter<InputBindingEvents<In>>;
    readonly target: BindingTarget;
    readonly value: Value<In>;
    readonly reader: (exValue: unknown) => In;
    readonly writer: BindingWriter<In>;
    constructor(config: Config_6<In>);
    read(): void;
    private write_;
    private onValueChange_;
  }

  /**
   * The API for the input binding between the parameter and the pane.
   * @template In The internal type.
   * @template Ex The external type (= parameter object).
   */
  declare class InputBindingApi<In, Ex> extends BladeApi<
    InputBindingController<In>
  > {
    private readonly emitter_;
    /**
     * @hidden
     */
    constructor(controller: InputBindingController<In>);
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    on<EventName extends keyof InputBindingApiEvents<Ex>>(
      eventName: EventName,
      handler: (ev: InputBindingApiEvents<Ex>[EventName]['event']) => void
    ): InputBindingApi<In, Ex>;
    refresh(): void;
    private onBindingChange_;
  }

  declare interface InputBindingApiEvents<Ex> {
    change: {
      event: TpChangeEvent<Ex>;
    };
  }

  /**
   * @hidden
   */
  declare class InputBindingController<In> extends LabelController<
    Controller<View>
  > {
    readonly binding: InputBinding<In>;
    constructor(doc: Document, config: Config_7<In>);
  }

  /**
   * @hidden
   */
  declare interface InputBindingEvents<In> {
    change: {
      options: ValueChangeOptions;
      rawValue: In;
      sender: InputBinding<In>;
    };
  }

  /**
   * An input binding plugin interface.
   * @template In The type of the internal value.
   * @template Ex The type of the external value. It will be provided by users.
   * @template P The type of the parameters.
   */
  declare interface InputBindingPlugin<In, Ex, P extends BaseInputParams>
    extends BasePlugin {
    type: 'input';
    /**
     * Decides whether the plugin accepts the provided value and the parameters.
     */
    accept: {
      /**
       * @param exValue The value input by users.
       * @param params The additional parameters specified by users.
       * @return A typed value if the plugin accepts the input, or null if the plugin sees them off and pass them to the next plugin.
       */
      (
        exValue: unknown,
        params: Record<string, unknown>
      ): Acceptance_2<Ex, P> | null;
    };
    /**
     * Configurations of the binding.
     */
    binding: {
      /**
       * Creates a value reader from the user input.
       */
      reader: {
        /**
         * @param args The arguments for binding.
         * @return A value reader.
         */
        (args: BindingArguments<Ex, P>): BindingReader<In>;
      };
      /**
       * Creates a value constraint from the user input.
       */
      constraint?: {
        /**
         * @param args The arguments for binding.
         * @return A value constraint.
         */
        (args: BindingArguments<Ex, P>): Constraint<In>;
      };
      /**
       * Compares the equality of two internal values.
       * Use `===` for primitive values, or a custom comparator for complex objects.
       */
      equals?: {
        /**
         * @param v1 The value.
         * @param v2 The another value.
         * @return true if equal, false otherwise.
         */
        (v1: In, v2: In): boolean;
      };
      /**
       * Creates a value writer from the user input.
       */
      writer: {
        /**
         * @param args The arguments for binding.
         * @return A value writer.
         */
        (args: BindingArguments<Ex, P>): BindingWriter<In>;
      };
    };
    /**
     * Creates a custom controller for the plugin.
     */
    controller: {
      /**
       * @param args The arguments for creating a controller.
       * @return A custom controller that contains a custom view.
       */
      (args: ControllerArguments_2<In, Ex, P>): Controller<View>;
    };
  }

  declare type InputParams =
    | BooleanInputParams
    | ColorInputParams
    | NumberInputParams
    | Point2dInputParams
    | Point3dInputParams
    | Point4dInputParams
    | StringInputParams;

  declare function insertElementAt(
    parentElement: Element,
    element: Element,
    index: number
  ): void;

  /**
   * @hidden
   */
  declare class IntervalTicker implements Ticker {
    readonly emitter: Emitter<TickerEvents>;
    private readonly interval_;
    private readonly doc_;
    private disabled_;
    private timerId_;
    constructor(doc: Document, interval: number);
    get disabled(): boolean;
    set disabled(inactive: boolean);
    dispose(): void;
    private clearTimer_;
    private setTimer_;
    private onTick_;
  }

  /**
   * @hidden
   */
  declare function isArrowKey(key: string): boolean;

  declare function isEmpty<T>(
    value: T | null | undefined
  ): value is null | undefined;

  declare function isPropertyWritable(obj: unknown, key: string): boolean;

  /**
   * @hidden
   */
  declare function isVerticalArrowKey(key: string): boolean;

  declare class LabelController<
    C extends Controller<View>,
  > extends BladeController<LabelView> {
    readonly props: LabelProps;
    readonly valueController: C;
    constructor(doc: Document, config: Config_5<C>);
  }

  declare class LabeledValueController<
    T,
    C extends ValueController<T, View>,
  > extends ValueBladeController<T, LabelView> {
    readonly props: LabelProps;
    readonly valueController: C;
    constructor(doc: Document, config: Config_25<T, C>);
  }

  declare type LabelProps = ValueMap<LabelPropsObject>;

  declare type LabelPropsObject = {
    label: string | null | undefined;
  };

  /**
   * @hidden
   */
  declare class LabelView implements View {
    readonly element: HTMLElement;
    readonly labelElement: HTMLElement;
    readonly valueElement: HTMLElement;
    constructor(doc: Document, config: Config_4);
  }

  /**
   * A list constranit.
   * @template T The type of the value.
   */
  declare class ListConstraint<T> implements Constraint<T> {
    readonly values: ValueMap<{
      options: ListItem<T>[];
    }>;
    constructor(options: ListItem<T>[]);
    /**
     * @deprecated Use values.get('options') instead.
     */
    get options(): ListItem<T>[];
    constrain(value: T): T;
  }

  declare class ListController<T> implements ValueController<T, ListView<T>> {
    readonly value: Value<T>;
    readonly view: ListView<T>;
    readonly props: ListProps<T>;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_29<T>);
    private onSelectChange_;
  }

  declare interface ListItem<T> {
    text: string;
    value: T;
  }

  declare type ListParamsOptions<T> =
    | ArrayStyleListOptions<T>
    | ObjectStyleListOptions<T>;

  declare type ListProps<T> = ValueMap<{
    options: ListItem<T>[];
  }>;

  /**
   * @hidden
   */
  declare class ListView<T> implements View {
    readonly selectElement: HTMLSelectElement;
    readonly element: HTMLElement;
    private readonly value_;
    private readonly props_;
    constructor(doc: Document, config: Config_28<T>);
    private update_;
    private onValueChange_;
  }

  declare function loopRange(value: number, max: number): number;

  /**
   * @hidden
   */
  declare class ManualTicker implements Ticker {
    readonly emitter: Emitter<TickerEvents>;
    disabled: boolean;
    constructor();
    dispose(): void;
    tick(): void;
  }

  declare function mapRange(
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): number;

  /**
   * @hidden
   */
  declare class MonitorBinding<T> {
    readonly emitter: Emitter<MonitorBindingEvents<T>>;
    readonly target: BindingTarget;
    readonly ticker: Ticker;
    readonly value: BufferedValue<T>;
    private reader_;
    constructor(config: Config_8<T>);
    dispose(): void;
    read(): void;
    private onTick_;
  }

  /**
   * The API for the monitor binding between the parameter and the pane.
   */
  declare class MonitorBindingApi<T> extends BladeApi<
    MonitorBindingController<T>
  > {
    private readonly emitter_;
    /**
     * @hidden
     */
    constructor(controller: MonitorBindingController<T>);
    get label(): string | null | undefined;
    set label(label: string | null | undefined);
    on<EventName extends keyof MonitorBindingApiEvents<T>>(
      eventName: EventName,
      handler: (ev: MonitorBindingApiEvents<T>[EventName]['event']) => void
    ): MonitorBindingApi<T>;
    refresh(): void;
    private onBindingUpdate_;
  }

  declare interface MonitorBindingApiEvents<T> {
    update: {
      event: TpUpdateEvent<T>;
    };
  }

  /**
   * @hidden
   */
  declare class MonitorBindingController<T> extends LabelController<
    Controller<View>
  > {
    readonly binding: MonitorBinding<T>;
    constructor(doc: Document, config: Config_9<T>);
  }

  /**
   * @hidden
   */
  declare interface MonitorBindingEvents<T> {
    update: {
      rawValue: T;
      sender: MonitorBinding<T>;
    };
  }

  /**
   * A monitor binding plugin interface.
   * @template T The type of the value.
   * @template P The type of the parameters.
   */
  declare interface MonitorBindingPlugin<T, P extends BaseMonitorParams>
    extends BasePlugin {
    type: 'monitor';
    accept: {
      /**
       * @param exValue The value input by users.
       * @param params The additional parameters specified by users.
       * @return A typed value if the plugin accepts the input, or null if the plugin sees them off and pass them to the next plugin.
       */
      (
        exValue: unknown,
        params: Record<string, unknown>
      ): Acceptance_3<T, P> | null;
    };
    /**
     * Configurations of the binding.
     */
    binding: {
      /**
       * Creates a value reader from the user input.
       */
      reader: {
        /**
         * @param args The arguments for binding.
         * @return A value reader.
         */
        (args: BindingArguments_2<T, P>): BindingReader<T>;
      };
      /**
       * Determinates the default buffer size of the plugin.
       */
      defaultBufferSize?: {
        /**
         * @param params The additional parameters specified by users.
         * @return The default buffer size
         */
        (params: P): number;
      };
    };
    /**
     * Creates a custom controller for the plugin.
     */
    controller: {
      /**
       * @param args The arguments for creating a controller.
       * @return A custom controller that contains a custom view.
       */
      (args: ControllerArguments_3<T, P>): Controller<View>;
    };
  }

  declare type MonitorParams =
    | BooleanMonitorParams
    | NumberMonitorParams
    | StringMonitorParams;

  /**
   * @hidden
   */
  declare class MultiLogController<T> implements Controller<MultiLogView<T>> {
    readonly value: BufferedValue<T>;
    readonly view: MultiLogView<T>;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_50<T>);
  }

  /**
   * @hidden
   */
  declare class MultiLogView<T> implements View {
    readonly element: HTMLElement;
    readonly value: BufferedValue<T>;
    private readonly formatter_;
    private readonly textareaElem_;
    constructor(doc: Document, config: Config_49<T>);
    private update_;
    private onValueUpdate_;
  }

  declare class NestedOrderedSet<T> {
    readonly emitter: Emitter<NestedOrderedSetEvents<T>>;
    private readonly items_;
    private readonly cache_;
    private readonly extract_;
    constructor(extract: Extractor<T>);
    get items(): T[];
    allItems(): T[];
    find(callback: (item: T) => boolean): T | null;
    includes(item: T): boolean;
    add(item: T, opt_index?: number): void;
    remove(item: T): void;
    private onSubListAdd_;
    private onSubListRemove_;
  }

  declare interface NestedOrderedSetEvents<T> {
    add: {
      index: number;
      item: T;
      root: NestedOrderedSet<T>;
      target: NestedOrderedSet<T>;
    };
    remove: {
      index: number;
      item: T;
      root: NestedOrderedSet<T>;
      target: NestedOrderedSet<T>;
    };
  }

  declare function normalizeListOptions<T>(
    options: ArrayStyleListOptions<T> | ObjectStyleListOptions<T>
  ): ListItem<T>[];

  /**
   * @hidden
   */
  declare const NumberColorInputPlugin: InputBindingPlugin<
    Color,
    number,
    ColorInputParams
  >;

  declare interface NumberConfig {
    dragging: Value<number | null>;
    props: NumberTextProps;
    value: Value<number>;
    viewProps: ViewProps;
    arrayPosition?: 'fst' | 'mid' | 'lst';
  }

  /**
   * @hidden
   */
  declare function numberFromUnknown(value: unknown): number;

  declare interface NumberInputParams extends BaseInputParams {
    format?: Formatter<number>;
    max?: number;
    min?: number;
    options?: ListParamsOptions<number>;
    step?: number;
  }

  /**
   * @hidden
   */
  declare const NumberInputPlugin: InputBindingPlugin<
    number,
    number,
    NumberInputParams
  >;

  declare interface NumberMonitorParams extends BaseMonitorParams {
    format?: Formatter<number>;
    lineCount?: number;
    max?: number;
    min?: number;
  }

  /**
   * @hidden
   */
  declare const NumberMonitorPlugin: MonitorBindingPlugin<
    number,
    NumberMonitorParams
  >;

  /**
   * @hidden
   */
  declare class NumberTextController implements Controller<NumberTextView> {
    readonly props: NumberTextProps;
    readonly value: Value<number>;
    readonly view: NumberTextView;
    readonly viewProps: ViewProps;
    private readonly sliderProps_;
    private readonly baseStep_;
    private readonly parser_;
    private readonly dragging_;
    private originRawValue_;
    constructor(doc: Document, config: Config_34);
    private constrainValue_;
    private onInputChange_;
    private onInputKeyDown_;
    private onInputKeyUp_;
    private onPointerDown_;
    private computeDraggingValue_;
    private onPointerMove_;
    private onPointerUp_;
  }

  declare type NumberTextProps = ValueMap<{
    draggingScale: number;
    formatter: Formatter<number>;
  }>;

  declare class NumberTextView implements View {
    readonly inputElement: HTMLInputElement;
    readonly knobElement: HTMLElement;
    readonly element: HTMLElement;
    readonly value: Value<number>;
    private readonly props_;
    private readonly dragging_;
    private readonly guideBodyElem_;
    private readonly guideHeadElem_;
    private readonly tooltipElem_;
    constructor(doc: Document, config: NumberConfig);
    private onDraggingChange_;
    refresh(): void;
    private onChange_;
  }

  /**
   * @hidden
   */
  declare function numberToRgbaColor(num: number): Color;

  /**
   * @hidden
   */
  declare function numberToRgbColor(num: number): Color;

  /**
   * @hidden
   */
  declare function numberToString(value: number): string;

  /**
   * @hidden
   */
  declare const ObjectColorInputPlugin: InputBindingPlugin<
    Color,
    RgbColorObject | RgbaColorObject,
    ColorInputParams
  >;

  declare type ObjectStyleListOptions<T> = {
    [text: string]: T;
  };

  declare type ParamsParser<T> = (value: unknown) => ParamsParsingResult<T>;

  declare const ParamsParsers: {
    optional: {
      custom: <T>(parse: (value: unknown) => T | undefined) => ParamsParser<T>;
      boolean: ParamsParser<boolean>;
      number: ParamsParser<number>;
      string: ParamsParser<string>;
      function: ParamsParser<Function>;
      constant: <T_1>(value: T_1) => ParamsParser<T_1>;
      raw: ParamsParser<unknown>;
      object: <O extends Record<string, unknown>>(keyToParserMap: {
        [Key in keyof O]: ParamsParser<O[Key]>;
      }) => ParamsParser<O>;
      array: <T_2>(itemParser: ParamsParser<T_2>) => ParamsParser<T_2[]>;
    };
    required: {
      custom: <T>(parse: (value: unknown) => T | undefined) => ParamsParser<T>;
      boolean: ParamsParser<boolean>;
      number: ParamsParser<number>;
      string: ParamsParser<string>;
      function: ParamsParser<Function>;
      constant: <T_1>(value: T_1) => ParamsParser<T_1>;
      raw: ParamsParser<unknown>;
      object: <O extends Record<string, unknown>>(keyToParserMap: {
        [Key in keyof O]: ParamsParser<O[Key]>;
      }) => ParamsParser<O>;
      array: <T_2>(itemParser: ParamsParser<T_2>) => ParamsParser<T_2[]>;
    };
  };

  declare type ParamsParsingResult<T> =
    | {
        succeeded: true;
        value: T | undefined;
      }
    | {
        succeeded: false;
        value: undefined;
      };

  declare function parseListOptions<T>(
    value: unknown
  ): ListParamsOptions<T> | undefined;

  /**
   * @hidden
   */
  declare function parseNumber(text: string): number | null;

  declare function parseParams<O extends Record<string, unknown>>(
    value: Record<string, unknown>,
    keyToParserMap: {
      [Key in keyof O]: ParamsParser<O[Key]>;
    }
  ): O | undefined;

  declare function parsePickerLayout(value: unknown): PickerLayout | undefined;

  declare function parsePointDimensionParams(
    value: unknown
  ): PointDimensionParams | undefined;

  declare type Parser<T> = (text: string) => T | null;

  declare type PickerLayout = 'inline' | 'popup';

  /**
   * @hidden
   */
  declare class PlainView implements View {
    readonly element: HTMLElement;
    constructor(doc: Document, config: Config_13);
  }

  /**
   * @hidden
   */
  declare class PluginPool {
    private readonly pluginsMap_;
    getAll(): TpPlugin[];
    register(r: TpPlugin): void;
    createInput(
      document: Document,
      target: BindingTarget,
      params: InputParams
    ): InputBindingController<unknown>;
    createMonitor(
      document: Document,
      target: BindingTarget,
      params: MonitorParams
    ): MonitorBindingController<unknown>;
    createBlade(
      document: Document,
      params: Record<string, unknown>
    ): BladeController<View>;
    createBladeApi(bc: BladeController<View>): BladeApi<BladeController<View>>;
  }

  declare type PluginType = 'blade' | 'input' | 'monitor';

  declare class Point2d {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    getComponents(): [number, number];
    static isObject(obj: any): obj is Point2dObject;
    static equals(v1: Point2d, v2: Point2d): boolean;
    toObject(): Point2dObject;
  }

  /**
   * @hidden
   */
  declare class Point2dController implements Controller<Point2dView> {
    readonly value: Value<Point2d>;
    readonly view: Point2dView;
    readonly viewProps: ViewProps;
    private readonly popC_;
    private readonly pickerC_;
    private readonly textC_;
    private readonly foldable_;
    constructor(doc: Document, config: Config_48);
    private onPadButtonBlur_;
    private onPadButtonClick_;
    private onPopupChildBlur_;
    private onPopupChildKeydown_;
  }

  declare interface Point2dInputParams extends BaseInputParams {
    expanded?: boolean;
    picker?: PickerLayout;
    x?: PointDimensionParams;
    y?: Point2dYParams;
  }

  /**
   * @hidden
   */
  declare const Point2dInputPlugin: InputBindingPlugin<
    Point2d,
    Point2dObject,
    Point2dInputParams
  >;

  declare interface Point2dObject {
    x: number;
    y: number;
  }

  /**
   * @hidden
   */
  declare class Point2dView implements View {
    readonly element: HTMLElement;
    readonly buttonElement: HTMLButtonElement;
    readonly textElement: HTMLElement;
    readonly pickerElement: HTMLElement | null;
    constructor(doc: Document, config: Config_47);
  }

  declare interface Point2dYParams extends PointDimensionParams {
    inverted?: boolean;
  }

  declare class Point3d {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    getComponents(): [number, number, number];
    static isObject(obj: any): obj is Point3dObject;
    static equals(v1: Point3d, v2: Point3d): boolean;
    toObject(): Point3dObject;
  }

  declare interface Point3dInputParams extends BaseInputParams {
    x?: PointDimensionParams;
    y?: PointDimensionParams;
    z?: PointDimensionParams;
  }

  /**
   * @hidden
   */
  declare const Point3dInputPlugin: InputBindingPlugin<
    Point3d,
    Point3dObject,
    Point3dInputParams
  >;

  declare interface Point3dObject {
    x: number;
    y: number;
    z: number;
  }

  declare class Point4d {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    getComponents(): Tuple4<number>;
    static isObject(obj: any): obj is Point4dObject;
    static equals(v1: Point4d, v2: Point4d): boolean;
    toObject(): Point4dObject;
  }

  declare interface Point4dInputParams extends BaseInputParams {
    x?: PointDimensionParams;
    y?: PointDimensionParams;
    z?: PointDimensionParams;
    w?: PointDimensionParams;
  }

  /**
   * @hidden
   */
  declare const Point4dInputPlugin: InputBindingPlugin<
    Point4d,
    Point4dObject,
    Point4dInputParams
  >;

  declare interface Point4dObject {
    x: number;
    y: number;
    z: number;
    w: number;
  }

  declare interface PointDimensionParams {
    max?: number;
    min?: number;
    step?: number;
  }

  /**
   * Data for pointer events.
   */
  declare interface PointerData {
    /**
     * The size of the bounds.
     */
    bounds: {
      height: number;
      width: number;
    };
    /**
     * The pointer coordinates.
     */
    point: {
      /**
       * The X coordinate in the element.
       */
      x: number;
      /**
       * The Y coordinate in the element.
       */
      y: number;
    } | null;
  }

  /**
   * A utility class to handle both mouse and touch events.
   */
  declare class PointerHandler {
    readonly emitter: Emitter<PointerHandlerEvents>;
    private readonly elem_;
    private lastTouch_;
    constructor(element: HTMLElement);
    private computePosition_;
    private onMouseDown_;
    private onDocumentMouseMove_;
    private onDocumentMouseUp_;
    private onTouchStart_;
    private onTouchMove_;
    private onTouchEnd_;
  }

  /**
   * An event for PointerHandler.
   */
  declare interface PointerHandlerEvent {
    altKey: boolean;
    data: PointerData;
    shiftKey: boolean;
    sender: PointerHandler;
  }

  declare interface PointerHandlerEvents {
    down: PointerHandlerEvent;
    move: PointerHandlerEvent;
    up: PointerHandlerEvent;
  }

  declare interface PointNdAssembly<PointNd> {
    toComponents: (p: PointNd) => number[];
    fromComponents: (comps: number[]) => PointNd;
  }

  /**
   * @hidden
   */
  declare class PointNdConstraint<PointNd> implements Constraint<PointNd> {
    readonly components: (Constraint<number> | undefined)[];
    private readonly asm_;
    constructor(config: Config_44<PointNd>);
    constrain(value: PointNd): PointNd;
  }

  /**
   * @hidden
   */
  declare class PointNdTextController<PointNd>
    implements Controller<PointNdTextView>
  {
    readonly value: Value<PointNd>;
    readonly view: PointNdTextView;
    readonly viewProps: ViewProps;
    private readonly acs_;
    constructor(doc: Document, config: Config_46<PointNd>);
  }

  /**
   * @hidden
   */
  declare class PointNdTextView implements View {
    readonly element: HTMLElement;
    readonly textViews: NumberTextView[];
    constructor(doc: Document, config: Config_45);
  }

  declare class PopupController implements Controller<PopupView> {
    readonly shows: Value<boolean>;
    readonly view: PopupView;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_31);
  }

  /**
   * @hidden
   */
  declare class PopupView implements View {
    readonly element: HTMLElement;
    constructor(doc: Document, config: Config_30);
  }

  /**
   * The union of primitive types.
   */
  declare type Primitive = boolean | number | string;

  declare class RackApi
    extends BladeApi<RackController>
    implements BladeRackApi
  {
    private readonly emitter_;
    private readonly apiSet_;
    private readonly pool_;
    /**
     * @hidden
     */
    constructor(controller: RackController, pool: PluginPool);
    get children(): BladeApi<BladeController<View>>[];
    addInput<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: InputParams
    ): InputBindingApi<unknown, O[Key]>;
    addMonitor<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: MonitorParams
    ): MonitorBindingApi<O[Key]>;
    addFolder(params: FolderParams): FolderApi;
    addButton(params: ButtonParams): ButtonApi;
    addSeparator(opt_params?: SeparatorParams): SeparatorApi;
    addTab(params: TabParams): TabApi;
    add<A extends BladeApi<BladeController<View>>>(
      api: A,
      opt_index?: number
    ): A;
    remove(api: BladeApi<BladeController<View>>): void;
    addBlade(params: BaseBladeParams): BladeApi<BladeController<View>>;
    on<EventName extends keyof BladeRackApiEvents>(
      eventName: EventName,
      handler: (ev: BladeRackApiEvents[EventName]['event']) => void
    ): this;
    private setUpApi_;
    private onRackAdd_;
    private onRackRemove_;
    private onRackInputChange_;
    private onRackMonitorUpdate_;
  }

  declare class RackController extends BladeController<PlainView> {
    readonly rack: BladeRack;
    constructor(doc: Document, config: Config_14);
    private onRackAdd_;
    private onRackRemove_;
  }

  /**
   * @hidden
   */
  declare class RackLikeApi<
    C extends BladeController<View>,
  > extends BladeApi<C> {
    /**
     * @hidden
     */
    protected readonly rackApi_: RackApi;
    constructor(controller: C, rackApi: RackApi);
  }

  declare class RackLikeController<V extends View> extends BladeController<V> {
    readonly rackController: RackController;
    constructor(config: Config_17<V>);
  }

  /**
   * A number range constraint.
   */
  declare class RangeConstraint implements Constraint<number> {
    readonly values: ValueMap<{
      max: number | undefined;
      min: number | undefined;
    }>;
    constructor(config: Config_27);
    /**
     * @deprecated Use values.get('max') instead.
     */
    get maxValue(): number | undefined;
    /**
     * @deprecated Use values.get('min') instead.
     */
    get minValue(): number | undefined;
    constrain(value: number): number;
  }

  declare class ReadonlyValue<T> {
    private value_;
    constructor(value: Value<T>);
    static create<T>(value: Value<T>): [ReadonlyValue<T>, SetRawValue<T>];
    /**
     * The event emitter for value changes.
     */
    get emitter(): Emitter<ValueEvents<T>>;
    /**
     * The raw value of the model.
     */
    get rawValue(): T;
  }

  declare function removeChildElements(element: Element): void;

  declare function removeChildNodes(element: Element): void;

  declare function removeElement(element: Element): void;

  declare interface RgbaColorObject {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  declare interface RgbColorObject {
    r: number;
    g: number;
    b: number;
  }

  declare class SeparatorApi extends BladeApi<SeparatorController> {}

  declare interface SeparatorBladeParams extends BaseBladeParams {
    view: 'separator';
  }

  declare const SeparatorBladePlugin: BladePlugin<SeparatorBladeParams>;

  /**
   * @hidden
   */
  declare class SeparatorController extends BladeController<SeparatorView> {
    constructor(doc: Document, config: Config_16);
  }

  declare type SeparatorParams = BaseParams;

  /**
   * @hidden
   */
  declare class SeparatorView implements View {
    readonly element: HTMLElement;
    constructor(doc: Document, config: Config_15);
  }

  declare type SetRawValue<T> = (
    rawValue: T,
    options?: ValueChangeOptions | undefined
  ) => void;

  /**
   * @hidden
   */
  declare class SingleLogController<T> implements Controller<SingleLogView<T>> {
    readonly value: BufferedValue<T>;
    readonly view: SingleLogView<T>;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_52<T>);
  }

  /**
   * @hidden
   */
  declare class SingleLogView<T> implements View {
    readonly element: HTMLElement;
    readonly inputElement: HTMLInputElement;
    readonly value: BufferedValue<T>;
    private readonly formatter_;
    constructor(doc: Document, config: Config_51<T>);
    private update_;
    private onValueUpdate_;
  }

  /**
   * @hidden
   */
  declare class SliderController implements Controller<SliderView> {
    readonly value: Value<number>;
    readonly view: SliderView;
    readonly viewProps: ViewProps;
    readonly props: SliderProps;
    private readonly ptHandler_;
    private readonly baseStep_;
    constructor(doc: Document, config: Config_36);
    private handlePointerEvent_;
    private onPointerDownOrMove_;
    private onPointerUp_;
    private onKeyDown_;
    private onKeyUp_;
  }

  declare type SliderProps = ValueMap<{
    maxValue: number;
    minValue: number;
  }>;

  declare class SliderTextController
    implements ValueController<number, SliderTextView>
  {
    readonly value: Value<number>;
    readonly view: SliderTextView;
    readonly viewProps: ViewProps;
    private readonly sliderC_;
    private readonly textC_;
    constructor(doc: Document, config: Config_38);
    get sliderController(): SliderController;
    get textController(): NumberTextController;
  }

  /**
   * @hidden
   */
  declare class SliderTextView implements View {
    readonly element: HTMLElement;
    private readonly sliderView_;
    private readonly textView_;
    constructor(doc: Document, config: Config_37);
  }

  /**
   * @hidden
   */
  declare class SliderView implements View {
    readonly element: HTMLElement;
    readonly knobElement: HTMLDivElement;
    readonly trackElement: HTMLDivElement;
    readonly value: Value<number>;
    private readonly props_;
    constructor(doc: Document, config: Config_35);
    private update_;
    private onChange_;
  }

  /**
   * A number step range constraint.
   */
  declare class StepConstraint implements Constraint<number> {
    readonly step: number;
    readonly origin: number;
    constructor(step: number, origin?: number);
    constrain(value: number): number;
  }

  declare interface StepKeys {
    altKey: boolean;
    downKey: boolean;
    shiftKey: boolean;
    upKey: boolean;
  }

  declare interface StringColorFormat {
    alpha: boolean;
    mode: ColorMode;
    notation: StringColorNotation2;
    type: ColorType;
  }

  /**
   * @hidden
   */
  declare const StringColorInputPlugin: InputBindingPlugin<
    Color,
    string,
    ColorInputParams
  >;

  /**
   * @deprecated
   */
  declare type StringColorNotation =
    | 'hex.rgb'
    | 'hex.rgba'
    | 'func.hsl'
    | 'func.hsla'
    | 'func.rgb'
    | 'func.rgba';

  declare type StringColorNotation2 = 'func' | 'hex' | 'object';

  /**
   * @hidden
   */
  declare function stringFromUnknown(value: unknown): string;

  declare interface StringInputParams extends BaseInputParams {
    options?: ListParamsOptions<string>;
  }

  /**
   * @hidden
   */
  declare const StringInputPlugin: InputBindingPlugin<
    string,
    string,
    StringInputParams
  >;

  declare interface StringMonitorParams extends BaseMonitorParams {
    lineCount?: number;
    multiline?: boolean;
  }

  /**
   * @hidden
   */
  declare const StringMonitorPlugin: MonitorBindingPlugin<
    string,
    StringMonitorParams
  >;

  declare function supportsTouch(doc: Document): boolean;

  declare const SVG_NS = 'http://www.w3.org/2000/svg';

  declare class Tab {
    readonly empty: Value<boolean>;
    readonly selectedIndex: Value<number>;
    private readonly items_;
    constructor();
    add(item: Value<boolean>, opt_index?: number): void;
    remove(item: Value<boolean>): void;
    private keepSelection_;
    private onItemSelectedChange_;
  }

  declare class TabApi extends RackLikeApi<TabController> {
    private readonly emitter_;
    private readonly pageApiMap_;
    /**
     * @hidden
     */
    constructor(controller: TabController, pool: PluginPool);
    get pages(): TabPageApi[];
    addPage(params: TabPageParams): TabPageApi;
    removePage(index: number): void;
    on<EventName extends keyof TabApiEvents>(
      eventName: EventName,
      handler: (ev: TabApiEvents[EventName]['event']) => void
    ): TabApi;
    private setUpPageApi_;
    private onPageAdd_;
    private onPageRemove_;
    private onSelect_;
  }

  declare interface TabApiEvents {
    change: {
      event: TpChangeEvent<unknown>;
    };
    select: {
      event: TpTabSelectEvent;
    };
    update: {
      event: TpUpdateEvent<unknown>;
    };
  }

  declare interface TabBladeParams extends BaseBladeParams {
    pages: {
      title: string;
    }[];
    view: 'tab';
  }

  declare const TabBladePlugin: BladePlugin<TabBladeParams>;

  declare class TabController extends RackLikeController<TabView> {
    private readonly pageSet_;
    readonly tab: Tab;
    constructor(doc: Document, config: Config_19);
    get pageSet(): NestedOrderedSet<TabPageController>;
    add(pc: TabPageController, opt_index?: number): void;
    remove(index: number): void;
    private onPageAdd_;
    private onPageRemove_;
  }

  declare class TabItemController implements Controller<TabItemView> {
    readonly emitter: Emitter<TabItemEvents>;
    readonly props: TabItemProps;
    readonly view: TabItemView;
    readonly viewProps: ViewProps;
    constructor(doc: Document, config: Config_22);
    private onClick_;
  }

  /**
   * @hidden
   */
  declare interface TabItemEvents {
    click: {
      sender: TabItemController;
    };
  }

  declare type TabItemProps = ValueMap<TabItemPropsObject>;

  declare type TabItemPropsObject = {
    selected: boolean;
    title: string | undefined;
  };

  /**
   * @hidden
   */
  declare class TabItemView implements View {
    readonly element: HTMLElement;
    readonly buttonElement: HTMLButtonElement;
    readonly titleElement: HTMLElement;
    constructor(doc: Document, config: Config_21);
  }

  declare class TabPageApi implements BladeRackApi {
    readonly controller_: TabPageController;
    private readonly rackApi_;
    constructor(controller: TabPageController, contentRackApi: RackApi);
    get title(): string;
    set title(title: string);
    get selected(): boolean;
    set selected(selected: boolean);
    get children(): BladeApi<BladeController<View>>[];
    addButton(params: ButtonParams): ButtonApi;
    addFolder(params: FolderParams): FolderApi;
    addSeparator(opt_params?: SeparatorParams): SeparatorApi;
    addTab(params: TabParams): TabApi;
    add(api: BladeApi<BladeController<View>>, opt_index?: number): void;
    remove(api: BladeApi<BladeController<View>>): void;
    addInput<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: InputParams
    ): InputBindingApi<unknown, O[Key]>;
    addMonitor<O extends Bindable, Key extends keyof O>(
      object: O,
      key: Key,
      opt_params?: MonitorParams
    ): MonitorBindingApi<O[Key]>;
    addBlade(params: BaseBladeParams): BladeApi<BladeController<View>>;
  }

  declare class TabPageController {
    readonly props: TabPageProps;
    private readonly ic_;
    private readonly cc_;
    constructor(doc: Document, config: Config_20);
    get itemController(): TabItemController;
    get contentController(): RackController;
    private onItemClick_;
  }

  declare interface TabPageParams {
    title: string;
    index?: number;
  }

  declare type TabPageProps = ValueMap<TabPagePropsObject>;

  declare type TabPagePropsObject = {
    selected: boolean;
  };

  declare interface TabParams extends BaseParams {
    pages: {
      title: string;
    }[];
  }

  declare class TabView implements View {
    readonly element: HTMLElement;
    readonly itemsElement: HTMLElement;
    readonly contentsElement: HTMLElement;
    constructor(doc: Document, config: Config_18);
  }

  declare class TextController<T> implements ValueController<T, TextView<T>> {
    readonly props: TextProps<T>;
    readonly value: Value<T>;
    readonly view: TextView<T>;
    readonly viewProps: ViewProps;
    private readonly parser_;
    constructor(doc: Document, config: Config<T>);
    private onInputChange_;
  }

  declare type TextProps<T> = ValueMap<{
    formatter: Formatter<T>;
  }>;

  /**
   * @hidden
   */
  declare class TextView<T> implements View {
    readonly inputElement: HTMLInputElement;
    readonly element: HTMLElement;
    private readonly props_;
    private readonly value_;
    constructor(doc: Document, config: Config_32<T>);
    refresh(): void;
    private onChange_;
  }

  /**
   * @hidden
   */
  declare interface Ticker {
    readonly emitter: Emitter<TickerEvents>;
    disabled: boolean;
    dispose(): void;
  }

  /**
   * @hidden
   */
  declare interface TickerEvents {
    tick: {
      sender: Ticker;
    };
  }

  /**
   * An event class for value changes of input bindings.
   * @template T The type of the value.
   */
  declare class TpChangeEvent<T> extends TpEvent {
    /**
     * The preset key of the event target.
     */
    readonly presetKey?: string;
    /**
     * The value.
     */
    readonly value: T;
    /**
     * The flag indicating whether the event is for the last change.
     */
    readonly last: boolean;
    /**
     * @hidden
     */
    constructor(target: unknown, value: T, presetKey?: string, last?: boolean);
  }

  declare class TpError<T extends ErrorType> {
    static alreadyDisposed(): TpError<'alreadydisposed'>;
    static notBindable(): TpError<'notbindable'>;
    static propertyNotFound(name: string): TpError<'propertynotfound'>;
    static shouldNeverHappen(): TpError<'shouldneverhappen'>;
    readonly message: string;
    readonly name: string;
    readonly stack?: string;
    readonly type: ErrorType;
    constructor(config: Config_39<T>);
  }

  /**
   * A base class of Tweakpane API events.
   */
  declare class TpEvent {
    /**
     * The event dispatcher.
     */
    readonly target: unknown;
    /**
     * @hidden
     */
    constructor(target: unknown);
  }

  /**
   * An event class for folder.
   */
  declare class TpFoldEvent extends TpEvent {
    /**
     * The current state of the folder expansion.
     */
    readonly expanded: boolean;
    /**
     * @hidden
     */
    constructor(target: unknown, expanded: boolean);
  }

  declare type TpPlugin =
    | BladePlugin<any>
    | InputBindingPlugin<any, any, any>
    | MonitorBindingPlugin<any, any>;

  declare type TpPluginBundle =
    | {
        plugin: TpPlugin;
      }
    | {
        plugins: TpPlugin[];
      };

  /**
   * An event class for tab selection.
   */
  declare class TpTabSelectEvent extends TpEvent {
    /**
     * The selected index of the tab item.
     */
    readonly index: number;
    /**
     * @hidden
     */
    constructor(target: unknown, index: number);
  }

  /**
   * An event class for value updates of monitor bindings.
   * @template T The type of the value.
   */
  declare class TpUpdateEvent<T> extends TpEvent {
    /**
     * The preset key of the event target.
     */
    readonly presetKey: string;
    /**
     * The value.
     */
    readonly value: T;
    /**
     * @hidden
     */
    constructor(target: unknown, value: T, presetKey: string);
  }

  declare type Tuple3<T> = [T, T, T];

  declare type Tuple4<T> = [T, T, T, T];

  /**
   * A model for handling value changes.
   * @template T The type of the raw value.
   */
  declare interface Value<T> {
    /**
     * The event emitter for value changes.
     */
    readonly emitter: Emitter<ValueEvents<T>>;
    /**
     * The raw value of the model.
     */
    rawValue: T;
    setRawValue(rawValue: T, options?: ValueChangeOptions): void;
  }

  declare class ValueBladeController<
    T,
    V extends View,
  > extends BladeController<V> {
    readonly value: Value<T>;
    constructor(config: Config_12<T, V>);
  }

  /**
   * @hidden
   */
  declare interface ValueChangeOptions {
    /**
     * The flag indicating whether an event should be fired even if the value doesn't change.
     */
    forceEmit: boolean;
    /**
     * The flag indicating whether the event is for the last change.
     */
    last: boolean;
  }

  declare interface ValueController<T, V extends View> extends Controller<V> {
    readonly value: Value<T>;
  }

  /**
   * @hidden
   */
  declare interface ValueEvents<T> {
    beforechange: {
      sender: Value<T>;
    };
    change: {
      options: ValueChangeOptions;
      previousRawValue: T;
      rawValue: T;
      sender: Value<T>;
    };
  }

  declare class ValueMap<O extends Record<string, unknown>> {
    readonly emitter: Emitter<ValueMapEvents<O>>;
    private readonly valMap_;
    constructor(valueMap: ValueMapCore<O>);
    static createCore<O extends Record<string, unknown>>(
      initialValue: O
    ): ValueMapCore<O>;
    static fromObject<O extends Record<string, unknown>>(
      initialValue: O
    ): ValueMap<O>;
    get<Key extends keyof O>(key: Key): O[Key];
    set<Key extends keyof O>(key: Key, value: O[Key]): void;
    value<Key extends keyof O>(key: Key): Value<O[Key]>;
  }

  declare type ValueMapCore<O extends Record<string, unknown>> = {
    [Key in keyof O]: Value<O[Key]>;
  };

  declare interface ValueMapEvents<O extends Record<string, unknown>> {
    change: {
      key: keyof O;
      sender: ValueMap<O>;
    };
  }

  declare function valueToClassName(
    elem: HTMLElement,
    className: string
  ): (value: boolean) => void;

  /**
   * A view interface.
   */
  declare interface View {
    /**
     * A root element of the view.
     */
    readonly element: HTMLElement;
  }

  declare class ViewProps extends ValueMap<ViewPropsObject> {
    private readonly globalDisabled_;
    private readonly setGlobalDisabled_;
    constructor(valueMap: {
      [Key in keyof ViewPropsObject]: Value<ViewPropsObject[Key]>;
    });
    static create(opt_initialValue?: Partial<ViewPropsObject>): ViewProps;
    get globalDisabled(): ReadonlyValue<boolean>;
    bindClassModifiers(elem: HTMLElement): void;
    bindDisabled(target: Disableable): void;
    bindTabIndex(elem: HTMLOrSVGElement): void;
    handleDispose(callback: () => void): void;
    /**
     * Gets a global disabled of the view.
     * Disabled of the view will be affected by its disabled and its parent disabled.
     */
    private getGlobalDisabled_;
    private updateGlobalDisabled_;
    private onDisabledChange_;
    private onParentGlobalDisabledChange_;
    private onParentChange_;
  }

  declare type ViewPropsEvents = ValueMapEvents<ViewPropsObject>;

  declare type ViewPropsObject = {
    disabled: boolean;
    disposed: boolean;
    hidden: boolean;
    parent: ViewProps | null;
  };

  declare function warnDeprecation(info: {
    name: string;
    alternative?: string;
    postscript?: string;
  }): void;

  declare function warnMissing(info: {
    key: string;
    target: string;
    place: string;
  }): void;

  /**
   * Writes the primitive value.
   * @param target The target to be written.
   * @param value The value to write.
   */
  declare function writePrimitive<T extends Primitive>(
    target: BindingTarget,
    value: T
  ): void;
  //#endregion
}
