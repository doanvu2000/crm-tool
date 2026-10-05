// SKU Analysis CVS - one-query Power Query implementation.
// Excel setup: convert the input range to an Excel Table named SkuInput,
// with the column names used by the CRM template, then paste this query into
// Power Query Advanced Editor. Refresh after changing the source table.
// Defaults match the app: 56 days, ABC 70/90, velocity basis = ADS.
let
    PeriodDays = 56,
    CutA = 0.70,
    CutB = 0.90,
    VelocityBasis = "ADS", // "ADS" or "Index"

    ToNumber = (v as any) as number =>
        if v = null then 0
        else if Value.Is(v, type number) then Number.From(v)
        else
            let
                t = Text.Trim(Text.From(v)),
                vn = try Number.FromText(t, "vi-VN"),
                en = try Number.FromText(t, "en-US")
            in
                if t = "" then 0 else if not vn[HasError] then vn[Value] else if not en[HasError] then en[Value] else 0,

    ToText = (v as any, optional fallback as nullable text) as text =>
        if v = null or Text.Trim(Text.From(v)) = "" then (if fallback = null then "" else fallback)
        else Text.Trim(Text.From(v)),

    ToLifecycle = (v as any) as text =>
        let k = Text.Upper(Text.Trim(Text.From(if v = null then "" else v)))
        in if List.Contains({"NEW", "MOI", "NEW SKU", "SP MOI"}, k) then "New"
           else if List.Contains({"EOL", "END OF LIFE", "NGUNG", "NGUNG KINH DOANH", "THAI BO"}, k) then "EOL"
           else "Active",

    ToSeasonal = (v as any) as logical =>
        List.Contains({"Y", "YES", "TRUE", "1", "CO", "CÓ"}, Text.Upper(Text.Trim(Text.From(if v = null then "" else v)))),

    Source = Excel.CurrentWorkbook(){[Name = "SkuInput"]}[Content],
    HasCategoryColumn = Table.HasColumns(Source, "category"),
    RequiredColumns = {"sku", "revenue", "units", "units_prev", "stock"},
    MissingRequired = List.Difference(RequiredColumns, Table.ColumnNames(Source)),
    CheckedSource = if List.Count(MissingRequired) > 0
        then error ("SkuInput thiếu cột bắt buộc: " & Text.Combine(MissingRequired, ", "))
        else Source,
    OptionalColumns = {"name", "category", "subcat1", "subcat2", "revenue_prev", "gp", "oos_days", "lifecycle", "seasonal", "days"},
    WithOptionalColumns = List.Accumulate(OptionalColumns, CheckedSource, (state, col) =>
        if Table.HasColumns(state, col) then state else Table.AddColumn(state, col, each null)),
    Selected = Table.SelectColumns(WithOptionalColumns,
        {"sku", "name", "category", "subcat1", "subcat2", "revenue", "revenue_prev", "gp", "units", "units_prev", "oos_days", "stock", "lifecycle", "seasonal", "days"}),
    Normalized = Table.TransformRows(Selected, (r) => [
        sku = ToText(r[sku], ""),
        name = ToText(r[name], ""),
        category = ToText(r[category], if HasCategoryColumn then "Khác" else "Chung"),
        subcat1 = ToText(r[subcat1], ""),
        subcat2 = ToText(r[subcat2], ""),
        revenue = ToNumber(r[revenue]),
        revenue_prev = ToNumber(r[revenue_prev]),
        gp = ToNumber(r[gp]),
        units = ToNumber(r[units]),
        units_prev = ToNumber(r[units_prev]),
        oos_days = ToNumber(r[oos_days]),
        stock = ToNumber(r[stock]),
        lifecycle = ToLifecycle(r[lifecycle]),
        seasonal = ToSeasonal(r[seasonal]),
        days = ToNumber(r[days])
    ]),
    Input = Table.FromRecords(List.Select(Normalized, each [sku] <> "")),
    WithInputIndex = Table.AddIndexColumn(Input, "_source_order", 0, 1, Int64.Type),
    WithInputDays = Table.RenameColumns(WithInputIndex, {{"days", "_input_days"}}),

    WithMetrics = Table.AddColumn(WithInputDays, "_metrics", (r) =>
        let
            d = if r[_input_days] > 0 then r[_input_days] else PeriodDays,
            oos = List.Min({List.Max({r[oos_days], 0}), d}),
            selling = d - oos,
            ads = if selling > 0 then r[units] / selling else 0,
            oosRate = if d > 0 then oos / d else 0,
            expected = ads * d,
            demandBase = if oosRate > 0.20 then expected else r[units],
            growth = if r[units_prev] > 0 then (demandBase - r[units_prev]) / r[units_prev] else null,
            dos = if ads > 0 then r[stock] / ads else if r[stock] > 0 then null else null,
            price = if r[units] > 0 then r[revenue] / r[units] else 0,
            prevEstimated = not (r[revenue_prev] > 0) and r[units_prev] > 0,
            prevRevenue = if r[revenue_prev] > 0 then r[revenue_prev] else if prevEstimated then r[units_prev] * price else 0,
            prevPrice = if r[units_prev] > 0 then prevRevenue / r[units_prev] else price,
            unitsDelta = r[units] - r[units_prev],
            revenueDelta = r[revenue] - prevRevenue,
            volumeEffect = unitsDelta * prevPrice
        in [
            days = d, selling_days = selling, ads = ads, oos_rate = oosRate,
            expected_demand = expected, growth = growth, dos = dos,
            prev_revenue = prevRevenue, prev_revenue_estimated = prevEstimated,
            units_delta = unitsDelta,
            units_change = if r[units_prev] > 0 then unitsDelta / r[units_prev] else null,
            revenue_delta = revenueDelta,
            revenue_growth = if prevRevenue > 0 then revenueDelta / prevRevenue else null,
            volume_effect = volumeEffect, price_effect = revenueDelta - volumeEffect
        ]),
    Metrics = Table.ExpandRecordColumn(WithMetrics, "_metrics",
        {"days", "selling_days", "ads", "oos_rate", "expected_demand", "growth", "dos", "prev_revenue", "prev_revenue_estimated", "units_delta", "units_change", "revenue_delta", "revenue_growth", "volume_effect", "price_effect"}),

    CategoryAds = Table.Group(Metrics, {"category"}, {{"category_avg_ads", each List.Average([ads]), type number}}),
    WithCategoryAds = Table.ExpandTableColumn(Table.NestedJoin(Metrics, {"category"}, CategoryAds, {"category"}, "_cat", JoinKind.LeftOuter), "_cat", {"category_avg_ads"}),
    WithAdsIndex = Table.AddColumn(WithCategoryAds, "ads_index", each if [category_avg_ads] > 0 then [ads] / [category_avg_ads] else 0, type number),

    WithSalesValue = Table.AddColumn(WithAdsIndex, "_sales_value", each List.Max({0, [revenue]}), type number),
    ByCategory = Table.Group(WithSalesValue, {"category"}, {{"_rows", (t) =>
        let
            Sorted = Table.Sort(t, {{"_sales_value", Order.Descending}, {"_source_order", Order.Ascending}}),
            TotalSales = List.Sum(Sorted[_sales_value]),
            Indexed = Table.AddIndexColumn(Sorted, "rank", 1, 1, Int64.Type),
            WithShare = Table.AddColumn(Indexed, "sales_share", each if TotalSales > 0 then [_sales_value] / TotalSales else 0, type number),
            WithCumShare = Table.AddColumn(WithShare, "cumulative_share", each if TotalSales > 0 then List.Sum(List.FirstN(WithShare[_sales_value], [rank])) / TotalSales else 0, type number),
            WithAbc = Table.AddColumn(WithCumShare, "abc", each
                if [_sales_value] <= 0 then "C"
                else if (if TotalSales > 0 then List.Sum(List.FirstN(WithCumShare[_sales_value], [rank] - 1)) / TotalSales else 0) < CutA then "A"
                else if (if TotalSales > 0 then List.Sum(List.FirstN(WithCumShare[_sales_value], [rank] - 1)) / TotalSales else 0) < CutB then "B"
                else "C", type text)
        in WithAbc, type table}}),
    ExpandedAbc = Table.ExpandTableColumn(ByCategory, "_rows",
        List.RemoveItems(Table.ColumnNames(WithSalesValue), {"category"}) & {"rank", "sales_share", "cumulative_share", "abc"}),

    WithClassifications = Table.AddColumn(ExpandedAbc, "_class", (r) =>
        let
            velocity = if Text.Upper(VelocityBasis) = "INDEX"
                then if r[ads_index] >= 1 then "Fast" else if r[ads_index] >= 0.7 then "Normal" else if r[ads_index] >= 0.3 then "Slow" else "Very Slow"
                else if r[ads] >= 20 then "Fast" else if r[ads] >= 15 then "Normal" else if r[ads] > 5 then "Slow" else "Very Slow",
            dosStatus = if r[dos] = null then (if r[stock] > 0 then "Overstock" else "N/A")
                else if r[dos] <= 7 then "Critical Low" else if r[dos] <= 15 then "Low" else if r[dos] <= 30 then "Healthy" else if r[dos] <= 60 then "High" else if r[dos] <= 90 then "Excess" else "Overstock",
            oosStatus = if r[oos_rate] <= 0.05 then "Healthy" else if r[oos_rate] <= 0.10 then "Warning" else if r[oos_rate] <= 0.20 then "Critical" else "Severe OOS",
            trend = if r[growth] = null then "N/A" else if r[growth] > 0.20 then "Strong Growth" else if r[growth] >= 0.05 then "Growth" else if r[growth] > -0.05 then "Stable" else if r[growth] >= -0.20 then "Decline" else "Sharp Decline",
            isNew = r[lifecycle] = "New" or (r[units_prev] <= 0 and r[units] > 0),
            isCore = r[abc] = "A" and r[ads] >= 20 and r[ads_index] >= 0.7 and r[oos_rate] <= 0.10 and r[lifecycle] <> "EOL"
        in [velocity = velocity, dos_status = dosStatus, oos_status = oosStatus, trend = trend, is_new = isNew, is_core = isCore]),
    Classified = Table.ExpandRecordColumn(WithClassifications, "_class", {"velocity", "dos_status", "oos_status", "trend", "is_new", "is_core"}),

    WithAction = Table.AddColumn(Classified, "_action", (r) =>
        let
            dosText = if r[dos] = null and r[stock] > 0 then "DOS vô hạn (tồn, không bán)" else if r[dos] = null then "DOS N/A" else "DOS " & Number.ToText(Number.Round(r[dos], 1), "0.0", "vi-VN") & " ngày",
            trendText = if r[growth] = null then "không có kỳ trước" else "Growth " & Number.ToText(Number.Round(r[growth] * 100, 1), "0.0", "vi-VN") & "%",
            decision =
                if r[lifecycle] = "EOL" then [rule = if r[stock] > 0 then "eol-stock" else "eol-empty", group = "Stop PO / Xả hàng", action = if r[stock] > 0 then "Stop PO, clearance tồn còn lại" else "Ngừng PO, đóng mã", reason = if r[stock] > 0 then "Lifecycle = EOL; còn tồn" else "Lifecycle = EOL; tồn = 0"]
                else if r[is_new] then if r[dos] <> null and r[dos] <= 15 then [rule = "new-replenish", group = "Tăng PO", action = "Bổ sung theo test, chưa áp ABC", reason = (if r[lifecycle] = "New" then "Lifecycle = New" else "Không có số bán kỳ trước") & "; " & dosText] else [rule = "new-watch", group = "Review", action = "Theo dõi New SKU, chưa kết luận", reason = (if r[lifecycle] = "New" then "Lifecycle = New" else "Không có số bán kỳ trước") & "; " & dosText]
                else if r[seasonal] then [rule = "seasonal", group = "Review", action = "Review theo mùa vụ trước khi đặt PO", reason = "Hàng mùa vụ; " & trendText & "; " & dosText]
                else if r[oos_status] = "Severe OOS" then [rule = "severe-oos", group = "Tăng PO", action = "Tính lại nhu cầu, bổ sung khẩn", reason = "Severe OOS; nhu cầu dự kiến " & Number.ToText(Number.Round(r[expected_demand], 0), "0", "vi-VN") & " sp/kỳ"]
                else if r[dos_status] = "N/A" then [rule = "no-sales", group = "Review", action = "Không bán, không tồn: review mã", reason = "Số bán = 0; tồn = 0"]
                else if r[dos_status] = "Critical Low" and r[velocity] = "Very Slow" and r[abc] = "C" then [rule = "critical-slow-c", group = "Review", action = "Thiếu hàng nhưng bán rất chậm: review trước khi PO", reason = dosText & "; Very Slow; ABC = C"]
                else if r[dos_status] = "Critical Low" then [rule = "critical", group = "Tăng PO", action = "Urgent replenishment", reason = dosText & "; ABC = " & r[abc]]
                else if r[dos_status] = "Low" and r[trend] = "Sharp Decline" then [rule = "low-sharp", group = "Duy trì", action = "Bổ sung vừa đủ, theo dõi suy giảm", reason = dosText & "; " & trendText]
                else if r[dos_status] = "Low" then [rule = "low", group = "Tăng PO", action = "Ưu tiên PO", reason = dosText & "; ABC = " & r[abc]]
                else if r[dos_status] = "Overstock" then [rule = "overstock", group = "Stop PO / Xả hàng", action = "Stop PO, clearance hoặc exit", reason = dosText & "; " & r[velocity]]
                else if r[dos_status] = "Excess" then [rule = "excess", group = "Giảm PO", action = "Giảm PO + kích cầu", reason = dosText & "; " & r[velocity]]
                else if r[dos_status] = "High" and (List.Contains({"Decline", "Sharp Decline"}, r[trend]) or List.Contains({"Slow", "Very Slow"}, r[velocity])) then [rule = "high-weak", group = "Giảm PO", action = "Giảm PO, kiểm soát tồn", reason = dosText & "; " & r[velocity] & "; " & trendText]
                else if r[dos_status] = "High" then [rule = "high", group = "Duy trì", action = "Kiểm soát PO", reason = dosText & "; " & trendText]
                else if r[dos_status] = "Healthy" and r[velocity] = "Very Slow" and r[abc] = "C" then [rule = "healthy-slow-c", group = "Review", action = "Review / promotion / exit", reason = "Very Slow; ABC = C; " & dosText]
                else if r[dos_status] = "Healthy" and r[trend] = "Strong Growth" then [rule = "healthy-strong", group = "Tăng PO", action = "Tăng forecast / supply capacity", reason = trendText & "; " & dosText]
                else if r[dos_status] = "Healthy" and r[trend] = "Sharp Decline" then [rule = "healthy-sharp", group = "Giảm PO", action = "Giảm PO mạnh, review lifecycle", reason = trendText]
                else if r[dos_status] = "Healthy" and r[trend] = "Decline" then [rule = "healthy-decline", group = "Giảm PO", action = "Giảm forecast / PO", reason = trendText]
                else if r[dos_status] = "Healthy" and r[is_core] then [rule = "healthy-core", group = "Duy trì", action = "Bảo vệ availability, ưu tiên safety stock", reason = dosText & "; Core SKU"]
                else [rule = "healthy", group = "Duy trì", action = "Duy trì", reason = dosText & "; " & trendText],
            reasonFinal = if r[is_core] then "Core SKU; " & decision[reason] else decision[reason]
        in [rule = decision[rule], action_group = decision[group], action = decision[action], action_reason = reasonFinal]),
    Actions = Table.ExpandRecordColumn(WithAction, "_action", {"rule", "action_group", "action", "action_reason"}),
    RemoveHelpers = Table.RemoveColumns(Actions, {"_sales_value", "_source_order", "_input_days"}),
    Result = Table.Sort(RemoveHelpers, {{"category", Order.Ascending}, {"rank", Order.Ascending}})
in
    Result
