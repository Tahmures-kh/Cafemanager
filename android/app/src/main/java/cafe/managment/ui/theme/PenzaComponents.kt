package cafe.managment.ui.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import cafe.managment.R
import cafe.managment.data.model.AuditLogEntry

/**
 * The backdrop used on every .penza-page in the web app: the user's wallpaper image, cropped to
 * fill, with a translucent white-to-mint scrim over it so cards/text stay legible.
 */
@Composable
fun PenzaBackground(content: @Composable BoxScope.() -> Unit) {
    Box(modifier = Modifier.fillMaxSize()) {
        Image(
            painter = painterResource(R.drawable.login_hero),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.White.copy(alpha = 0.88f), PenzaBackground.copy(alpha = 0.92f)),
                    ),
                ),
        )
        Box(modifier = Modifier.fillMaxSize(), content = content)
    }
}

/** Mirrors the little "● Penza" pill badge shown at the top of the web hero sections. */
@Composable
fun PenzaPill(text: String, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .clip(CircleShape)
            .background(Color.White)
            .padding(horizontal = 16.dp, vertical = 10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(9.dp)
                .clip(CircleShape)
                .background(PenzaGreen),
        )
        Text(
            text = text,
            style = PenzaEyebrowStyle,
            color = PenzaGreenDeep,
            modifier = Modifier.padding(start = 8.dp),
        )
    }
}

/** The rounded, tinted-border hero panel (.penza-hero) used at the top of every screen. */
@Composable
fun PenzaHero(
    modifier: Modifier = Modifier,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.extraLarge,
        colors = CardDefaults.cardColors(containerColor = PenzaMintSoft, contentColor = PenzaForeground),
        border = BorderStroke(1.dp, PenzaBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(24.dp),
            content = content,
        )
    }
}

/** The white, subtly-bordered content card (.penza-card) used throughout the dashboards. */
@Composable
fun PenzaCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(20.dp),
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = Color.White, contentColor = PenzaForeground),
        border = BorderStroke(1.dp, PenzaBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(contentPadding),
            content = content,
        )
    }
}

enum class PenzaTone { GREEN, RED, AMBER, NEUTRAL }

/** Small pill-shaped status/sms chip, reused across Purchases/Recipes/Sales list rows. */
@Composable
fun PenzaStatusBadge(text: String, tone: PenzaTone = PenzaTone.NEUTRAL, modifier: Modifier = Modifier) {
    val (bg, fg) = when (tone) {
        PenzaTone.GREEN -> PenzaMint to PenzaGreenDeep
        PenzaTone.RED -> Color(0xFFFDE8E8) to PenzaError
        PenzaTone.AMBER -> PenzaAmberSoft to PenzaAmberDeep
        PenzaTone.NEUTRAL -> PenzaMintSoft to PenzaMuted
    }
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .padding(horizontal = 12.dp, vertical = 5.dp),
    ) {
        Text(text = text, style = MaterialTheme.typography.labelSmall, color = fg)
    }
}

/** Maps a stock-status tier (see ProductUnits.StockStatusTier) to a badge tone. */
fun stockStatusTone(tier: cafe.managment.data.util.ProductUnits.StockStatusTier): PenzaTone = when (tier) {
    cafe.managment.data.util.ProductUnits.StockStatusTier.OUT,
    cafe.managment.data.util.ProductUnits.StockStatusTier.CRITICAL -> PenzaTone.RED
    cafe.managment.data.util.ProductUnits.StockStatusTier.LOW -> PenzaTone.AMBER
    cafe.managment.data.util.ProductUnits.StockStatusTier.OK -> PenzaTone.GREEN
}

/** Small metric tile used on dashboards (.penza-card stat cards in the web app). */
@Composable
fun PenzaStatCard(label: String, value: String, hint: String? = null, modifier: Modifier = Modifier) {
    PenzaCard(modifier = modifier, contentPadding = PaddingValues(16.dp)) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, color = PenzaMuted)
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            color = PenzaForeground,
            modifier = Modifier.padding(top = 8.dp),
        )
        if (hint != null) {
            Text(
                text = hint,
                style = MaterialTheme.typography.labelSmall,
                color = PenzaMuted,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

/** Thin rounded progress track used on order-tracking cards (requested vs. packed). */
@Composable
fun PenzaProgressBar(percent: Int, modifier: Modifier = Modifier) {
    val clamped = percent.coerceIn(0, 100)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(6.dp)
            .clip(CircleShape)
            .background(PenzaMint),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(clamped / 100f)
                .fillMaxSize()
                .clip(CircleShape)
                .background(PenzaGreen),
        )
    }
}

/** Compact audit-trail list, embedded in Purchases/Recipes/Sales screens (mirrors the web's inline history panel). */
@Composable
fun PenzaAuditHistory(entries: List<AuditLogEntry>, modifier: Modifier = Modifier) {
    if (entries.isEmpty()) {
        Text(
            text = "هنوز رویدادی ثبت نشده است.",
            style = MaterialTheme.typography.bodySmall,
            color = PenzaMuted,
            modifier = modifier,
        )
        return
    }

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        entries.forEach { entry ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(MaterialTheme.shapes.medium)
                    .background(PenzaMintSoft)
                    .padding(12.dp),
            ) {
                Column {
                    Text(text = entry.description, style = MaterialTheme.typography.bodySmall)
                    Text(
                        text = listOfNotNull(entry.actorName?.takeIf { it.isNotBlank() }, entry.createdAt)
                            .joinToString(" · "),
                        style = MaterialTheme.typography.labelSmall,
                        color = PenzaMuted,
                    )
                }
            }
        }
    }
}
