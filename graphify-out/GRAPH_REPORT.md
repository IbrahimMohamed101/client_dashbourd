# Graph Report - client_dashbourd  (2026-06-13)

## Corpus Check
- 392 files · ~128,796 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2534 nodes · 7078 edges · 106 communities (100 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7093b74c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 202 edges
2. `Button()` - 87 edges
3. `Card()` - 61 edges
4. `CardContent()` - 61 edges
5. `Input()` - 56 edges
6. `CardHeader()` - 46 edges
7. `CardTitle()` - 46 edges
8. `useMutationWithToast()` - 46 edges
9. `Badge()` - 44 edges
10. `FileRoutesByPath` - 42 edges

## Surprising Connections (you probably didn't know these)
- `OperationsDialogState` --references--> `UnifiedQueueItem`  [EXTRACTED]
  src/hooks/useOperationsBoardDialog.ts → src/types/dashboardOpsTypes.ts
- `DeliveryDashboardCardsProps` --references--> `UnifiedOperationalDTO`  [EXTRACTED]
  src/components/pages/delivery/DeliveryDashboardCards.tsx → src/types/dashboardOpsTypes.ts
- `SectionCard()` --calls--> `cn()`  [EXTRACTED]
  src/components/custom/section-cards.tsx → src/lib/utils.ts
- `OptionGroupOptionsPanelProps` --references--> `MenuOption`  [EXTRACTED]
  src/components/pages/menu/option-groups/OptionGroupOptionsPanel.tsx → src/types/menuTypes.ts
- `MenuProductFormFields()` --calls--> `NumberInput()`  [INFERRED]
  src/components/pages/menu/products/MenuProductFormFields.tsx → src/components/pages/menu/products/ProductCustomizationPanel.tsx

## Import Cycles
- None detected.

## Communities (106 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (41): addonsColumns, ButtonVariants, useDebounce(), useNewOrderDetection(), useOneTimeOrderActionMutation(), useOneTimeOrdersListQuery(), usePaymentsListQuery(), DeleteMutation (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (69): Route, Route, Route, Route, Route, Route, Route, Route (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): menuOptionGroupsQueryOptions(), useMenuOptionGroupsQuery(), menuOptionsQueryOptions(), useMenuOptionsQuery(), PRODUCTS_QUERIES_KEY, useLinkGroupsToProductMutation(), useLinkOptionsToGroupMutation(), useUpdateOptionAvailabilityInProductMutation() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (40): ApiErrorData, ApiErrorLike, getApiErrorMessage(), isApiErrorLike(), isRecord(), parseApiError(), ParsedApiError, readDetailsMessage() (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (55): CategoryProductsPanelProps, normalizeAvailableForFromApi(), MealBuilderCatalogData, BulkUpdateProductsResponse, BulkUpdateProductsResult, CategoryProductAssignmentResponse, CategoryProductAssignmentResult, CreateMenuMealCategoryPayload (+47 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (13): getPackagesSectionCards(), getPromoCodesSectionCards(), SectionCard(), SectionCardProps, SectionCards(), SectionCardsProps, promoCodesListQueryOptions(), Route (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (24): KitchenDashboardCardsProps, KitchenDataTableProps, KitchenFiltersProps, statusOptions, KitchenTabsProps, BulkLockResponse, KitchenOperationsRow, KitchenOperationsSummaryResponse (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (25): useCancelSubscriptionMutation(), useExtendSubscriptionMutation(), useFreezeSubscriptionMutation(), CancelModal(), CancelModalProps, ExtendFormValues, ExtendModal(), ExtendModalProps (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (39): CARD_VARIANT_LABELS, DISPLAY_STYLE_LABELS, formatSar(), MealPlannerMenuPreviewTab(), PlannerProductCard(), PRICING_MODEL_LABELS, SECTION_TYPE_LABELS, SELECTION_TYPE_LABELS (+31 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (13): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), DropdownMenuItem(), DropdownMenuLabel() (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (39): restaurantHoursQueryOptions, SETTINGS_KEYS, settingsQueryOptions, useSettingsQuery(), Detail(), detailLabels, getAddress(), getBranchId() (+31 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (39): allIdentityLinksQueryOptions(), IDENTITY_KEYS, menuIdentitiesQueryOptions(), menuIdentityDetailQueryOptions(), menuIdentityLinksQueryOptions(), menuIdentitySuggestionDetailQueryOptions(), menuIdentitySuggestionsQueryOptions(), useAllIdentityLinksQuery() (+31 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (39): ChartAreaInteractive(), useIsMobile(), useAuth(), AppSidebar(), NavMain(), NavSecondary(), NavUser(), SiteHeader() (+31 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (29): ADMIN_ROUTES, AUTH_ROUTES, canRoleAccessRoute(), CASHIER_ROUTES, COURIER_ROUTES, isRouteMatch(), KITCHEN_ROUTES, ROLE_DEFAULTS (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (35): PackageSummary, SectionCardsData, SubscriptionSummary, BoxIcon, BoxIconHandle, BoxIconProps, PATH_VARIANTS, BoxesIcon (+27 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (13): accountingReportParams, chartData, SectionDef, computeCounts(), KitchenStatusFilter, OperationsKitchenBoard(), statusOptions, Card() (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (32): resolved, withDate, AccountingDailyReportResponse, DashboardNotificationLogFilters, accountingDailyReportExportUrl(), accountingDailyReportUrl(), DashboardHealthKey, dashboardHealthUrl() (+24 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (20): DeliveryDashboardCards(), DeliveryDashboardCardsProps, STAT_CARDS, StatCard, DeliveryFilters(), DeliveryFiltersProps, FILTER_TABS, DeliveryList() (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (14): useUpdateSettingsMutation(), DISPLAY_STYLES, FormType, SettingsForm, SettingsFormContent(), Input(), Label(), Select() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (26): DeleteAddonDialogProps, ReasonActionDialogProps, ReasonFormValues, reasonSchema, isVerificationAction(), KitchenDataTable(), OneTimeOrderConfirmDialogProps, OneTimeOrderDetailProps (+18 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (32): LoginForm(), AddonsSection(), AddonsSectionProps, CreateSubscriptionFormContent(), CreateSubscriptionFormContentProps, DeliverySectionProps, PlanSelectionSectionProps, BuilderPremiumMeal (+24 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (34): dependencies, axios, class-variance-authority, clsx, date-fns, @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable (+26 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (13): missingNames, whitespaceNames, emptyLocalizedText, firstIdFromRefs(), firstNonEmptyString(), getMenuCategoryCreateDefaults(), getMenuCategoryFormValues(), getMenuOptionFormValues() (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (23): ALL_OPERATIONS_SCREENS, asArray(), asBoolean(), asNumber(), asRecord(), asString(), buildAddressSummary(), normalizeAllowedActions() (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (15): deliveryZonesListQueryOptions(), useDeleteDeliveryZoneMutation(), useDeliveryZonesListQuery(), CreateDeliveryZoneDTO, DeliveryZonesResponse, UpdateDeliveryZoneDTO, deliveryZoneToggleUrl(), createDeliveryZone() (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (30): MealBuilderPage(), mealBuilderHydratedQueryOptions(), mealBuilderQueryOptions(), mealBuilderReadinessQueryOptions(), useCreateMealBuilderDraftMutation(), useMealBuilderHydratedQuery(), useMealBuilderQuery(), useMealBuilderReadinessQuery() (+22 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (11): EditorState, MealBuilderWorkspace(), MealBuilderStatusCards(), formatDate(), readinessLabel(), toBackendSections(), usePublishMealBuilderDraftMutation(), useSaveMealBuilderDraftMutation() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (25): Route, UpdateAddonPage(), AddonFormFields(), AddonFormFieldsProps, AddonsTable(), CreateAddonPage(), Route, Route (+17 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (26): MenuAuditLogTab(), MenuEntityTableTabProps, menuAuditLogsQueryOptions(), menuVersionsQueryOptions(), useMenuAuditLogsQuery(), useMenuVersionsQuery(), useRollbackMenuVersionMutation(), MenuAuditLogParams (+18 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (34): KEYS, query, isOneTimeOrderActionAllowed(), KitchenQueueOneTimeOrder, ONE_TIME_ORDER_FINAL_STATES, OneTimeOrderActionResponse, OneTimeOrderActivityEntry, OneTimeOrderCustomer (+26 more)

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (27): categoryPayload, localized, optionGroupPayload, optionPayload, optionUpdatePayload, productDefaults, productPayload, CreateMenuPremiumProteinPayload (+19 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (21): KitchenQueueCardProps, ReasonDialogState, buildOperationsActionPayload(), getCourierItems(), getEndpointForAction(), getItemsByStatuses(), getPickupItems(), OperationsCourierBoard() (+13 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (32): IssueRow(), PremiumBadge(), StatusBadge(), ERROR_COPY, PREMIUM_REQUIRED_KEYS, REQUIRED_SECTION_ORDER, SECTION_LABELS, SECTION_RULE_BADGES (+24 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (16): ToastMessage(), ToastType, useCreateMenuOptionMutation(), useUpdateMenuOptionMutation(), UpdateOptionForm(), CreateOptionPage(), MenuOptionFormFields(), Props (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (19): Order, recentOrders, recentSubscriptions, Subscription, dashboardSectionCards, orderColumns, subscriptionColumns, DataTable() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (12): KitchenQueueCard(), KitchenOperationsListResponse, KitchenOperationsMode, isUnsupportedOneTimeOrderAction(), bulkLockDays(), CourierActionPayload, executeKitchenAction(), fetchKitchenOperationsList() (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (12): addOptionToCard(), addProductToCard(), Catalog, ensureOptionSectionIndex(), ensureProductSectionIndex(), findPrimarySectionIndex(), MealBuilderCardEditor(), rebuildCard() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (23): menuProductComposerQueryOptions(), useMenuProductComposerQuery(), BulkUpdateProductsPayload, CreateMenuProductPayload, MenuProductComposerResponse, MenuProductListParams, MenuProductsResponse, UpdateMenuProductPayload (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (25): AddonCard(), asArray(), asRecord(), DetailRow, formatDateTime(), formatHalala(), getRawRecord(), getText() (+17 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (19): UserSelectionSection(), allUsersQueryOptions(), useAllUsersQuery(), userDetailsQueryOptions(), useUpdateUserMutation(), useUserDetailsQuery(), UserNameCrumb(), PaginatedUsersResponse (+11 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (13): AddonsCard(), CustomerInfoCard(), DeliveryInfoCard(), PremiumMealsCard(), SubscriptionContractCard(), TechnicalDetailsAccordion(), useUnfreezeSubscriptionMutation(), Route (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 42 - "Community 42"
Cohesion: 0.09
Nodes (35): promoCodeDetailQueryOptions(), useCreatePromoCodeMutation(), useDeletePromoCodeMutation(), usePromoCodeDetailQuery(), usePromoCodesListQuery(), useUpdatePromoCodeMutation(), formatPromoCodeDate(), formatPromoCodeDiscount() (+27 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (16): ApiStatusError, createSubscriptionAddonEntitlement(), deleteSubscriptionAddonEntitlement(), fetchSubscriptionAddonEntitlements(), fetchSubscriptionBalances(), fetchSubscriptionDays(), replaceSubscriptionAddonEntitlements(), updateSubscriptionBalances() (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (16): BEEF_KEYS, BEEF_MATCHERS, buildMealBuilderVisualCards(), CARB_KEYS, CARB_MATCHERS, CHICKEN_KEYS, CHICKEN_MATCHERS, createEmptyCards() (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.10
Nodes (22): AddonStatusBadge(), DeleteAddonDialog(), CardProps, SubscriptionHeader(), SubscriptionHeaderProps, DeductionForm(), DeductionFormProps, DeductionFormValues (+14 more)

### Community 46 - "Community 46"
Cohesion: 0.08
Nodes (29): MenuKeyBadge(), customizationLibraryQueryOptions(), productCustomizationQueryOptions(), useCustomizationLibraryQuery(), useProductCustomizationQuery(), useSaveProductCustomizationMutation(), displayStyleLabels, ProductCustomizationPanel() (+21 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (23): UserRole, DashboardHealthReportResponse, DashboardLogsResponse, DashboardNotificationLogsResponse, DashboardNotificationSummaryData, DashboardNotificationSummaryItem, DashboardNotificationSummaryResponse, DashboardPaginationMeta (+15 more)

### Community 48 - "Community 48"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (7): getFinanceSectionCards(), paymentsListQueryOptions(), Route, RouteComponent(), Payment, PaymentDetails, PaymentsResponse

### Community 50 - "Community 50"
Cohesion: 0.09
Nodes (31): isCanonicalSubscriptionPlanKey(), DEFAULT_GRAM, DEFAULT_MEAL, EMPTY_DEFAULTS, useCreatePackageForm(), packagesQueryOptions(), BasicInfoSection(), BasicInfoSectionProps (+23 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (15): useOperationsBoard(), initialDialogState, OperationsDialogAction, OperationsDialogState, useOperationsBoardDialog(), getSafeOperationsTab(), getScreensForRole(), OperationsBoard() (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (18): UpdateOptionGroupForm(), UpdateOptionGroupPage(), menuOptionGroupDetailQueryOptions(), useCreateMenuOptionGroupMutation(), useMenuOptionGroupDetailQuery(), useUpdateMenuOptionGroupMutation(), CreateOptionGroupPage(), MenuOptionGroupFormFields() (+10 more)

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (21): AddonSubscription, AddonSummaryItem, ContractMeta, DeliveryAddress, DeliverySlot, ExtendSubscriptionPayload, FreezeSubscriptionPayload, PremiumSummaryItem (+13 more)

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (11): queryClient, ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (14): ACTION_CONFIG, ActionConfig, ButtonVariant, DeliveryCard(), DeliveryCardProps, DeliveryListProps, DeliveryTimeline(), DeliveryTimelineProps (+6 more)

### Community 57 - "Community 57"
Cohesion: 0.06
Nodes (32): MenuCategoriesTab(), legacyMenuTabMap, workflowSteps, menuTabValues, Route, ACTION_LABELS, CategoryActions, ENTITY_LABELS (+24 more)

### Community 58 - "Community 58"
Cohesion: 0.13
Nodes (22): QueryResult, menuOptionDetailQueryOptions(), useMenuOptionDetailQuery(), UpdateOptionPage(), CreateMenuOptionPayload, MenuOptionDetailResponse, MenuOptionListParams, MenuOptionsResponse (+14 more)

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (21): RouteComponent(), RouteComponent(), accountingDailyReportQueryOptions(), dashboardStaffUsersQueryOptions(), useAccountingDailyReportQuery(), useDashboardStaffUsersQuery(), AccountingDailyReportParams, DashboardLogFilters (+13 more)

### Community 60 - "Community 60"
Cohesion: 0.23
Nodes (15): BulkAssignProductsToCategoryPayload, CreateMenuCategoryPayload, MenuCategoriesResponse, ReorderItem, UpdateMenuCategoryPayload, fetchBulkAssignProductsToCategory(), fetchCreateMenuCategory(), fetchDeleteMenuCategory() (+7 more)

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (18): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, prettier, prettier-plugin-tailwindcss (+10 more)

### Community 62 - "Community 62"
Cohesion: 0.17
Nodes (13): CANONICAL_SUBSCRIPTION_PLAN_KEYS, CanonicalSubscriptionPlanKey, DEFAULT_MENU_AVAILABLE_FOR, MENU_AVAILABLE_CHANNELS, MENU_PRODUCT_CARD_SIZE_OPTIONS, MENU_PRODUCT_CARD_SIZES, MenuAvailableChannel, MenuProductCardSize (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (12): DeliverySection(), deliveryOptionsQueryOptions(), useDeliveryOptionsQuery(), DeliveryArea, DeliveryDefaults, DeliveryMethod, DeliveryOptionsData, DeliveryOptionsResponse (+4 more)

### Community 64 - "Community 64"
Cohesion: 0.10
Nodes (29): CategoryProductsPanel(), ApiError, useMutationWithToast(), UseMutationWithToastOptions, useBulkAssignProductsToCategoryMutation(), useReorderMenuCategoriesMutation(), useReorderMenuOptionGroupsMutation(), useToggleMenuOptionGroupActiveMutation() (+21 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (13): BADGE_CLASSES, BadgeColorKey, CANCELED_STATUSES, DashboardQueueItemV2, DashboardQueueV2Response, DataQualityWarning, DELIVERED_STATUSES, DisplayEntity (+5 more)

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (5): useRestaurantHoursQuery(), useUpdateRestaurantHoursMutation(), RestaurantHoursForm, RestaurantHoursFormContent(), RestaurantHoursPage()

### Community 67 - "Community 67"
Cohesion: 0.23
Nodes (10): routeTranslations, AppBreadcrumb(), buildCrumbs(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.13
Nodes (12): ARROW_VARIANTS, PATH_VARIANTS, SVG_VARIANTS, TrendingDownIcon, TrendingDownIconHandle, TrendingDownIconProps, ARROW_VARIANTS, PATH_VARIANTS (+4 more)

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (13): createPromoCode(), deletePromoCode(), fetchPromoCodeById(), fetchPromoCodesList(), FetchPromoCodesListParams, isRecord(), normalizePromoCodeDetailResponse(), normalizePromoCodesListResponse() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.15
Nodes (19): Loader(), LoaderProps, sizeClasses, useCreateMenuProductMutation(), useUpdateMenuProductMutation(), UpdateMenuProductForm(), UpdateMenuProductPage(), CreateMenuProductPage() (+11 more)

### Community 71 - "Community 71"
Cohesion: 0.15
Nodes (14): filterCanonicalSubscriptionPlans(), PlanSelectionSection(), usePackagesQuery(), DraggableRow(), packagesColumns, StatusBadge(), plans, FreezePolicy (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.12
Nodes (18): UseOperationsBoardParams, api, AxiosRequestConfig, extractOperationsQueueItems(), OPERATIONS_SCREENS, OperationsScreen, DashboardOpsActionResponse, DashboardOpsListResponse (+10 more)

### Community 73 - "Community 73"
Cohesion: 0.38
Nodes (6): getSubscriptionsSectionCards(), subscriptionsSummaryQueryOptions(), useSubscriptionsSummaryQuery(), Route, RouteComponent(), SubscriptionSummaryResponse

### Community 74 - "Community 74"
Cohesion: 0.14
Nodes (5): groupRelationId(), normalizeGroupRule(), normalizeOption(), optionRelationId(), ProductComposerRelationsPanelProps

### Community 75 - "Community 75"
Cohesion: 0.22
Nodes (5): dashboardNotificationLogsQueryOptions(), dashboardNotificationSummaryQueryOptions(), NotificationsPage(), Route, JsonObject

### Community 76 - "Community 76"
Cohesion: 0.31
Nodes (9): NewOrderInfo, UseNewOrderDetectionOptions, OneTimeOrdersColumnsOptions, OneTimeOrderListItem, getAudioContext(), playNewOrderSound(), playUrgentNewOrderSound(), requestNotificationPermission() (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.22
Nodes (6): ACTION_CONFIG, getOneTimeOrdersColumns(), OneTimeOrderPaymentBadge(), OneTimeOrderPaymentBadgeProps, PAYMENT_CONFIG, OneTimeOrderPaymentStatus

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 79 - "Community 79"
Cohesion: 0.07
Nodes (30): cn(), AlertAction(), AlertDialogMedia(), AlertDialogOverlay(), Calendar(), CalendarDayButton(), CardFooter(), DrawerContent() (+22 more)

### Community 80 - "Community 80"
Cohesion: 0.12
Nodes (16): formatSar(), getSelectionRange(), isCustomizable(), isEnabled(), OptionBadge(), OptionGroupPreview(), PreviewWarning, ProductCard() (+8 more)

### Community 81 - "Community 81"
Cohesion: 0.20
Nodes (12): useOneTimeOrderDetailQuery(), FALLBACK_PICKUP_ACTIONS_BY_STATUS, getOneTimeOrderRowActions(), sanitizeActions(), OneTimeOrderDetail(), OneTimeOrderStatusBadge(), OneTimeOrderStatusBadgeProps, PickupQueueCard() (+4 more)

### Community 82 - "Community 82"
Cohesion: 0.47
Nodes (5): usersQueryOptions(), useUsersListQuery(), Route, RouteComponent(), UsersTable()

### Community 83 - "Community 83"
Cohesion: 0.18
Nodes (10): ActionButtons(), actionIcons, columnHelper, getItemNames(), getModeLabel(), getStatusClasses(), getVisibleActions(), OperationsMobileCard() (+2 more)

### Community 84 - "Community 84"
Cohesion: 0.47
Nodes (6): extractItems(), extractPagination(), normalizeMealCategoriesResponse(), normalizePremiumProteinsResponse(), normalizeProteinsResponse(), toPaginatedResponse()

### Community 85 - "Community 85"
Cohesion: 0.22
Nodes (6): useTheme(), MyRouterContext, Route, FileRoutesById, Toaster(), TooltipProvider()

### Community 86 - "Community 86"
Cohesion: 0.36
Nodes (4): paymentDetailsQueryOptions(), usePaymentDetailsQuery(), fetchPaymentDetails(), fetchPaymentsList()

### Community 87 - "Community 87"
Cohesion: 0.22
Nodes (8): menuPremiumProteinSchema, MenuPremiumProteinSchemaInput, MenuPremiumProteinSchemaType, localizedTextSchema, menuProteinSchema, MenuProteinSchemaInput, MenuProteinSchemaType, optionalLocalizedTextSchema

### Community 88 - "Community 88"
Cohesion: 0.32
Nodes (5): NavLinksData, filterNavItemsForRole(), NavItem, cashierUrls, kitchenUrls

### Community 89 - "Community 89"
Cohesion: 0.13
Nodes (17): subscriptionDetailsQueryOptions(), subscriptionsListQueryOptions(), useManualDeductSubscriptionMutation(), useSearchSubscriptionsByPhoneQuery(), useSubscriptionDetailsQuery(), useSubscriptionsListQuery(), ManualDeductionPage(), cancelSubscription() (+9 more)

### Community 90 - "Community 90"
Cohesion: 0.29
Nodes (7): scripts, build, dev, format, lint, preview, typecheck

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 92 - "Community 92"
Cohesion: 0.40
Nodes (4): legacyBlankFieldsProduct, legacySarPriceProduct, nestedAlternateProduct, response

### Community 93 - "Community 93"
Cohesion: 0.15
Nodes (17): CreateMenuCategoryPage(), MenuCategoryFormFields(), Props, UpdateMenuCategoryForm(), UpdateMenuCategoryPage(), menuCategoryDetailQueryOptions(), useCreateMenuCategoryMutation(), useMenuCategoryDetailQuery() (+9 more)

### Community 95 - "Community 95"
Cohesion: 0.53
Nodes (4): useResetDashboardStaffUserPasswordMutation(), formatDate(), ProfilePage(), translateRole()

### Community 97 - "Community 97"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 99 - "Community 99"
Cohesion: 0.40
Nodes (4): buildCommand, installCommand, outputDirectory, rewrites

### Community 104 - "Community 104"
Cohesion: 0.13
Nodes (21): useCreateDeliveryZoneMutation(), useUpdateDeliveryZoneMutation(), FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, CustomerSearchProps, SearchFormValues (+13 more)

## Knowledge Gaps
- **545 isolated node(s):** `DetailRow`, `RecordValue`, `actionIcons`, `columnHelper`, `OperationsScreenConfig` (+540 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 79` to `Community 0`, `Community 5`, `Community 7`, `Community 9`, `Community 12`, `Community 14`, `Community 15`, `Community 18`, `Community 19`, `Community 20`, `Community 27`, `Community 40`, `Community 45`, `Community 46`, `Community 51`, `Community 67`, `Community 68`, `Community 70`, `Community 71`, `Community 78`, `Community 80`, `Community 82`, `Community 104`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `api` connect `Community 72` to `Community 2`, `Community 3`, `Community 8`, `Community 10`, `Community 11`, `Community 13`, `Community 16`, `Community 20`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 33`, `Community 34`, `Community 35`, `Community 37`, `Community 39`, `Community 43`, `Community 46`, `Community 50`, `Community 58`, `Community 59`, `Community 60`, `Community 63`, `Community 64`, `Community 69`, `Community 71`, `Community 86`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 19` to `Community 0`, `Community 1`, `Community 2`, `Community 7`, `Community 8`, `Community 12`, `Community 13`, `Community 15`, `Community 18`, `Community 20`, `Community 26`, `Community 27`, `Community 32`, `Community 33`, `Community 36`, `Community 39`, `Community 42`, `Community 45`, `Community 46`, `Community 50`, `Community 52`, `Community 56`, `Community 57`, `Community 66`, `Community 70`, `Community 71`, `Community 74`, `Community 75`, `Community 77`, `Community 79`, `Community 80`, `Community 83`, `Community 93`, `Community 95`, `Community 104`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `DetailRow`, `RecordValue`, `actionIcons` to the rest of the system?**
  _545 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11299435028248588 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03417721518987342 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06259426847662142 - nodes in this community are weakly interconnected._