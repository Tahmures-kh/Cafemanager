package cafe.managment.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val PenzaColorScheme = lightColorScheme(
    primary = PenzaGreen,
    onPrimary = Color.White,
    primaryContainer = PenzaMint,
    onPrimaryContainer = PenzaGreenDeep,
    secondary = PenzaGreenDeep,
    onSecondary = Color.White,
    background = PenzaBackground,
    onBackground = PenzaForeground,
    surface = Color.White,
    onSurface = PenzaForeground,
    surfaceVariant = PenzaMintSoft,
    onSurfaceVariant = PenzaMuted,
    outline = PenzaBorder,
    error = PenzaError,
    onError = Color.White,
)

private val PenzaShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

@Composable
fun PenzaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PenzaColorScheme,
        typography = PenzaTypography,
        shapes = PenzaShapes,
        content = content,
    )
}
